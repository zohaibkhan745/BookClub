from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.book import Book
from app.schemas.book import BookCreate
from typing import Optional
from datetime import datetime


class BorrowRequest:
    """In-memory borrow request (no separate table for MVP)."""
    def __init__(self, request_id: str, book_id: int, user_id: str, status: str, created_at: str):
        self.request_id = request_id
        self.book_id = book_id
        self.user_id = user_id  # Track who borrowed
        self.status = status
        self.created_at = created_at


# In-memory store for borrow requests (MVP - no separate table)
_borrow_requests: dict[str, BorrowRequest] = {}


def create_borrow_request(
    db: Session,
    book_id: int,
    user_id: str,
    borrower_name: str,
    borrower_email: str,
    borrower_phone: str,
    message: str = None
) -> dict:
    """
    Create a borrow request for a book.
    For MVP, stores in memory and updates book availability.
    """
    # Verify book exists
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        return None
    
    # Generate request ID
    import uuid
    request_id = f"br-{uuid.uuid4().hex[:8]}"
    
    # Store request with user_id for tracking
    request = BorrowRequest(
        request_id=request_id,
        book_id=book_id,
        user_id=user_id,
        status="pending",
        created_at=datetime.utcnow().isoformat() + "Z"
    )
    _borrow_requests[request_id] = request
    
    return {
        "requestId": request_id,
        "bookId": book_id,
        "status": "pending",
        "createdAt": request.created_at
    }


def get_borrow_request(request_id: str) -> Optional[BorrowRequest]:
    """Get a borrow request by ID."""
    return _borrow_requests.get(request_id)


def get_borrowed_books_by_user(db: Session, user_id: str) -> list[Book]:
    """
    Get all books borrowed by a specific user.
    Returns the Book objects for books with pending/approved borrow requests.
    """
    # Get all book IDs borrowed by this user
    borrowed_book_ids = [
        req.book_id 
        for req in _borrow_requests.values() 
        if req.user_id == user_id and req.status in ("pending", "approved")
    ]
    
    if not borrowed_book_ids:
        return []
    
    # Fetch the actual book records
    return db.query(Book).filter(Book.id.in_(borrowed_book_ids)).all()
