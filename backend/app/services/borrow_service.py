"""
Borrow service for business logic related to book borrowing.

Key Design Principle:
- Book's "borrowed" status is NOT stored in the books table
- A book is "borrowed" if there exists a BorrowRecord with returned_at IS NULL
- This provides full audit history and avoids data inconsistency

Handles:
- Borrowing a book
- Returning a book
- Getting borrow history
- Checking if a book is currently borrowed
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, update, exists
from typing import Optional, List
from datetime import datetime
import uuid
import logging

from app.models import Book, BorrowRecord, User
from app.models.borrow_record import BorrowStatus
from app.cache import cache

logger = logging.getLogger(__name__)

# Cache TTL for borrow status (shorter since it changes frequently)
CACHE_TTL_BORROW = 30  # 30 seconds


def get_active_borrow_for_book(db: Session, book_id) -> Optional[BorrowRecord]:
    """
    Get the current active borrow record for a book.
    
    A book is "borrowed" if status=BORROWED and returned_at IS NULL.
    (Not REQUESTED - that's a pending request)
    
    Args:
        db: Database session
        book_id: ID of the book (can be string or int)
    
    Returns:
        Active BorrowRecord if book is borrowed, None otherwise
    """
    # Convert to int if string (book_id is Integer in database)
    try:
        book_id_int = int(book_id)
    except (ValueError, TypeError):
        return None
    
    return db.query(BorrowRecord).filter(
        and_(
            BorrowRecord.book_id == book_id_int,
            BorrowRecord.returned_at.is_(None),
            BorrowRecord.status == BorrowStatus.borrowed.value
        )
    ).options(joinedload(BorrowRecord.borrower)).first()


def is_book_borrowed(db: Session, book_id) -> bool:
    """
    Check if a book is currently borrowed.
    Optimized: Uses EXISTS subquery instead of loading full record.
    
    Args:
        db: Database session
        book_id: ID of the book (can be string or int)
    
    Returns:
        True if book is borrowed, False otherwise
    """
    try:
        book_id_int = int(book_id)
    except (ValueError, TypeError):
        return False
    
    # Use EXISTS for better performance - doesn't load any data, just checks existence
    return db.query(
        exists().where(
            and_(
                BorrowRecord.book_id == book_id_int,
                BorrowRecord.returned_at.is_(None),
                BorrowRecord.status == BorrowStatus.borrowed.value
            )
        )
    ).scalar()


def get_borrow_status(db: Session, book_id) -> dict:
    """
    Get the full borrow status for a book.
    
    Returns:
        dict with:
        - is_borrowed: bool
        - borrower_name: str or None
        - borrower_id: str or None
        - due_at: datetime or None
        - current_borrow: BorrowRecord or None
    """
    active_borrow = get_active_borrow_for_book(db, book_id)
    
    if not active_borrow:
        return {
            "is_borrowed": False,
            "borrower_name": None,
            "borrower_id": None,
            "due_at": None,
            "current_borrow": None
        }
    
    borrower_name = None
    if active_borrow.borrower:
        borrower_name = active_borrow.borrower.full_name
    
    return {
        "is_borrowed": True,
        "borrower_name": borrower_name,
        "borrower_id": active_borrow.borrower_id,
        "due_at": active_borrow.due_at,
        "current_borrow": active_borrow
    }


def borrow_book(
    db: Session,
    book_id,
    borrower_id: str,
    due_at: Optional[datetime] = None
) -> BorrowRecord:
    """
    Create a borrow record for a book.
    
    This is a transactional operation that:
    1. Verifies the book exists and is not already borrowed
    2. Creates a new BorrowRecord
    
    Args:
        db: Database session
        book_id: ID of the book to borrow (can be string or int)
        borrower_id: ID of the borrower
        due_at: Optional due date for return
    
    Returns:
        Created BorrowRecord
    
    Raises:
        ValueError: If book doesn't exist or is already borrowed
    """
    # Convert to int if string
    try:
        book_id_int = int(book_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid book ID")
    
    # Verify book exists
    book = db.query(Book).filter(Book.id == book_id_int).first()
    if not book:
        raise ValueError("Book not found")
    
    if not book.is_available:
        raise ValueError("Book is not available")
    
    # Verify borrower exists
    borrower = db.query(User).filter(User.id == borrower_id).first()
    if not borrower:
        raise ValueError("Borrower not found")
    
    # Check if book is already borrowed
    existing_borrow = get_active_borrow_for_book(db, book_id)
    if existing_borrow:
        raise ValueError("Book is already borrowed")
    
    # Create borrow record (book_id_int used for Integer column)
    borrow_record = BorrowRecord(
        id=str(uuid.uuid4()),
        book_id=book_id_int,
        borrower_id=borrower_id,
        borrowed_at=datetime.utcnow(),
        due_at=due_at,
        status=BorrowStatus.borrowed.value,
    )
    
    # Mark book as unavailable
    book.is_available = False
    
    db.add(borrow_record)
    db.commit()
    db.refresh(borrow_record)
    
    return borrow_record


def request_to_borrow(
    db: Session,
    book_id,
    borrower_id: str,
) -> BorrowRecord:
    """
    Create a borrow REQUEST for a book (status=REQUESTED).
    
    This creates a pending request that the owner must approve.
    
    Args:
        db: Database session
        book_id: ID of the book to request
        borrower_id: ID of the user requesting to borrow
    
    Returns:
        Created BorrowRecord with status='requested'
    
    Raises:
        ValueError: If book doesn't exist, is unavailable, or user already requested
    """
    # Convert to int if string
    try:
        book_id_int = int(book_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid book ID")
    
    # Verify book exists
    book = db.query(Book).filter(Book.id == book_id_int).first()
    if not book:
        raise ValueError("Book not found")
    
    if not book.is_available:
        raise ValueError("Book is not available for borrowing")
    
    # Verify borrower exists
    borrower = db.query(User).filter(User.id == borrower_id).first()
    if not borrower:
        raise ValueError("User not found")
    
    # Cannot request your own book
    if book.user_id == borrower_id:
        raise ValueError("Cannot request your own book")
    
    # Check if user already has a pending request for this book
    existing_request = db.query(BorrowRecord).filter(
        and_(
            BorrowRecord.book_id == book_id_int,
            BorrowRecord.borrower_id == borrower_id,
            BorrowRecord.status == BorrowStatus.requested.value
        )
    ).first()
    
    if existing_request:
        raise ValueError("You already have a pending request for this book")
    
    # Create borrow request record
    borrow_record = BorrowRecord(
        id=str(uuid.uuid4()),
        book_id=book_id_int,
        borrower_id=borrower_id,
        borrowed_at=datetime.utcnow(),  # Request timestamp
        status=BorrowStatus.requested.value,
    )
    
    db.add(borrow_record)
    db.commit()
    db.refresh(borrow_record)
    
    # Load borrower relationship
    db.refresh(borrow_record, ['borrower'])
    
    return borrow_record


def get_pending_requests_for_book(db: Session, book_id) -> List[BorrowRecord]:
    """
    Get all pending borrow requests for a book.
    
    Args:
        db: Database session
        book_id: ID of the book
    
    Returns:
        List of BorrowRecords with status='requested'
    """
    try:
        book_id_int = int(book_id)
    except (ValueError, TypeError):
        return []
    
    return db.query(BorrowRecord).filter(
        and_(
            BorrowRecord.book_id == book_id_int,
            BorrowRecord.status == BorrowStatus.requested.value
        )
    ).options(joinedload(BorrowRecord.borrower)).order_by(desc(BorrowRecord.created_at)).all()


def approve_borrow_request(
    db: Session,
    request_id: str,
    owner_id: str,
    due_at: Optional[datetime] = None
) -> BorrowRecord:
    """
    Owner approves a borrow request, changing status to BORROWED.
    
    This also:
    1. Updates the book's is_available to False
    2. Cancels all other pending requests for this book
    
    Args:
        db: Database session
        request_id: ID of the borrow request to approve
        owner_id: ID of the book owner (for authorization)
        due_at: Optional due date
    
    Returns:
        Updated BorrowRecord with status='borrowed'
    
    Raises:
        ValueError: If request not found, not pending, or user not authorized
    """
    # Get the borrow request
    borrow_record = db.query(BorrowRecord).filter(
        BorrowRecord.id == request_id
    ).options(joinedload(BorrowRecord.book), joinedload(BorrowRecord.borrower)).first()
    
    if not borrow_record:
        raise ValueError("Borrow request not found")
    
    if borrow_record.status != BorrowStatus.requested.value:
        raise ValueError("This request is no longer pending")
    
    # Verify owner authorization
    book = borrow_record.book
    if not book:
        raise ValueError("Book not found")
    
    if book.user_id != owner_id:
        raise ValueError("Only the book owner can approve requests")
    
    # Update the approved request
    borrow_record.status = BorrowStatus.borrowed.value
    borrow_record.borrowed_at = datetime.utcnow()
    if due_at:
        borrow_record.due_at = due_at
    
    # Mark book as unavailable
    book.is_available = False
    
    # Cancel all other pending requests for this book
    other_requests = db.query(BorrowRecord).filter(
        and_(
            BorrowRecord.book_id == book.id,
            BorrowRecord.id != request_id,
            BorrowRecord.status == BorrowStatus.requested.value
        )
    ).all()
    
    for req in other_requests:
        req.status = BorrowStatus.cancelled.value
    
    db.commit()
    db.refresh(borrow_record)
    
    return borrow_record


def cancel_borrow_request(
    db: Session,
    request_id: str,
    user_id: str
) -> BorrowRecord:
    """
    Cancel a borrow request.
    
    Can be done by the requester or the book owner.
    
    Args:
        db: Database session
        request_id: ID of the borrow request
        user_id: ID of the user cancelling
    
    Returns:
        Updated BorrowRecord with status='cancelled'
    """
    borrow_record = db.query(BorrowRecord).filter(
        BorrowRecord.id == request_id
    ).options(joinedload(BorrowRecord.book)).first()
    
    if not borrow_record:
        raise ValueError("Borrow request not found")
    
    if borrow_record.status != BorrowStatus.requested.value:
        raise ValueError("Only pending requests can be cancelled")
    
    # Check authorization - either requester or book owner
    is_requester = borrow_record.borrower_id == user_id
    is_owner = borrow_record.book and borrow_record.book.user_id == user_id
    
    if not is_requester and not is_owner:
        raise ValueError("Not authorized to cancel this request")
    
    borrow_record.status = BorrowStatus.cancelled.value
    
    db.commit()
    db.refresh(borrow_record)
    
    return borrow_record


def return_book(db: Session, book_id, user_id: str) -> BorrowRecord:
    """
    Return a borrowed book.
    
    The return can be initiated by:
    - The borrower themselves
    - The book owner (to mark it as returned)
    
    Args:
        db: Database session
        book_id: ID of the book to return (can be string or int)
        user_id: ID of the user initiating the return
    
    Returns:
        Updated BorrowRecord
    
    Raises:
        ValueError: If book isn't borrowed or user can't return it
    """
    # Get the active borrow
    active_borrow = get_active_borrow_for_book(db, book_id)
    if not active_borrow:
        raise ValueError("Book is not currently borrowed")
    
    # Get the book to check ownership
    try:
        book_id_int = int(book_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid book ID")
    book = db.query(Book).filter(Book.id == book_id_int).first()
    
    # Verify user can return the book (borrower or owner)
    can_return = (
        active_borrow.borrower_id == user_id or  # Borrower returning
        (book and book.user_id == user_id)  # Owner marking as returned
    )
    
    if not can_return:
        raise ValueError("Only the borrower or book owner can return this book")
    
    # Update the borrow record
    active_borrow.returned_at = datetime.utcnow()
    active_borrow.status = BorrowStatus.returned.value
    
    # Mark book as available again
    if book:
        book.is_available = True
    
    db.commit()
    db.refresh(active_borrow)
    
    return active_borrow


def get_user_borrow_history(
    db: Session,
    user_id: str,
    include_returned: bool = True,
    limit: int = 50
) -> List[BorrowRecord]:
    """
    Get a user's borrow history.
    
    Args:
        db: Database session
        user_id: ID of the user
        include_returned: Whether to include returned books
        limit: Maximum records to return
    
    Returns:
        List of BorrowRecords
    """
    query = db.query(BorrowRecord).filter(
        BorrowRecord.borrower_id == user_id
    ).options(
        joinedload(BorrowRecord.book)
    )
    
    if not include_returned:
        query = query.filter(BorrowRecord.returned_at.is_(None))
    
    return query.order_by(desc(BorrowRecord.borrowed_at)).limit(limit).all()


def get_books_borrowed_by_user(db: Session, user_id: str, limit: int = 50) -> List[Book]:
    """
    Get all books currently borrowed by a user.
    
    Args:
        db: Database session
        user_id: ID of the user
        limit: Maximum books to return
    
    Returns:
        List of Books currently borrowed by the user
    """
    # Get active borrow records for this user (only BORROWED status, not REQUESTED)
    active_borrows = db.query(BorrowRecord).filter(
        and_(
            BorrowRecord.borrower_id == user_id,
            BorrowRecord.returned_at.is_(None),
            BorrowRecord.status == BorrowStatus.borrowed.value
        )
    ).limit(limit).all()
    
    if not active_borrows:
        return []
    
    # Get the book IDs
    book_ids = [br.book_id for br in active_borrows]
    
    # Fetch the books
    return db.query(Book).filter(Book.id.in_(book_ids)).all()


def get_book_borrow_history(db: Session, book_id, limit: int = 50) -> List[BorrowRecord]:
    """
    Get the borrow history for a specific book.
    
    Args:
        db: Database session
        book_id: ID of the book (can be string or int)
        limit: Maximum records to return
    
    Returns:
        List of BorrowRecords for this book
    """
    try:
        book_id_int = int(book_id)
    except (ValueError, TypeError):
        return []
    
    return db.query(BorrowRecord).filter(
        BorrowRecord.book_id == book_id_int
    ).options(
        joinedload(BorrowRecord.borrower)
    ).order_by(desc(BorrowRecord.borrowed_at)).limit(limit).all()


def update_overdue_status(db: Session) -> int:
    """
    Update status to 'overdue' for borrows past their due date.
    Optimized: Uses bulk UPDATE statement instead of loading all records.
    
    This should be run periodically (e.g., daily cron job).
    
    Returns:
        Number of records updated
    """
    now = datetime.utcnow()
    
    # Bulk update using UPDATE statement - much faster than load-modify-save
    result = db.execute(
        update(BorrowRecord)
        .where(
            and_(
                BorrowRecord.returned_at.is_(None),
                BorrowRecord.due_at.isnot(None),
                BorrowRecord.due_at < now,
                BorrowRecord.status == BorrowStatus.borrowed.value
            )
        )
        .values(status=BorrowStatus.overdue.value)
    )
    
    db.commit()
    
    return result.rowcount
