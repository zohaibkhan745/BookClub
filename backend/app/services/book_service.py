from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.book import Book
from app.schemas.book import BookCreate
from typing import Optional


def get_all_books(db: Session, limit: int = 50) -> list[Book]:
    """Fetch all available books."""
    return db.query(Book).filter(Book.is_available == True).order_by(desc(Book.created_at)).limit(limit).all()


def get_book_by_id(db: Session, book_id: int) -> Optional[Book]:
    """Fetch a single book by ID."""
    return db.query(Book).filter(Book.id == book_id).first()


def get_books_by_genre(db: Session, genre: str, limit: int = 50) -> list[Book]:
    """Fetch all available books by genre/category."""
    return db.query(Book).filter(
        Book.is_available == True,
        Book.category.ilike(f"%{genre}%")
    ).order_by(desc(Book.created_at)).limit(limit).all()


def get_books_by_section(db: Session, limit: int = 10) -> dict:
    """
    Get books organized by homepage sections.
    - trending: Most recent books
    - newArrivals: Latest additions
    - popular: Random selection (simulated popularity)
    """
    all_books = db.query(Book).filter(Book.is_available == True).order_by(desc(Book.created_at)).limit(30).all()
    
    # Split books into sections
    trending = all_books[:limit] if len(all_books) >= limit else all_books
    new_arrivals = all_books[limit:limit*2] if len(all_books) >= limit*2 else all_books[:limit]
    popular = all_books[limit*2:limit*3] if len(all_books) >= limit*3 else all_books[:limit]
    
    return {
        "trending": trending,
        "newArrivals": new_arrivals,
        "popular": popular,
    }


def create_book(db: Session, book_data: BookCreate) -> Book:
    """
    Create a new book listing.
    
    Security Note: uploaded_by_user_id and uploaded_by_full_name must be set
    by the API layer from the authenticated user context. These fields are
    never accepted from client input to prevent spoofing.
    """
    db_book = Book(
        title=book_data.title,
        author=book_data.author,
        category=book_data.category,
        listing_type=book_data.listing_type.value,
        condition=book_data.condition.value if book_data.condition else "good",
        description=book_data.description,
        cover_image=book_data.cover_image,
        price=book_data.price,
        whatsapp_number=book_data.whatsapp_number,
        # Ownership derived from authenticated user - never from frontend
        listed_by=book_data.listed_by,
        user_id=book_data.user_id,
        is_available=True,
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


def update_book_availability(db: Session, book_id: int, is_available: bool) -> Optional[Book]:
    """Update book availability status."""
    book = get_book_by_id(db, book_id)
    if book:
        book.is_available = is_available
        db.commit()
        db.refresh(book)
    return book


def get_books_by_user(db: Session, user_id: str, limit: int = 50) -> list[Book]:
    """Fetch all books uploaded by a specific user."""
    return db.query(Book).filter(
        Book.user_id == user_id
    ).order_by(desc(Book.created_at)).limit(limit).all()


def get_books_borrowed_by_user(db: Session, user_id: str, limit: int = 50) -> list[Book]:
    """
    Fetch all books borrowed by a specific user.
    Uses the borrowed_by_user_id field to identify borrowed books.
    """
    return db.query(Book).filter(
        Book.borrowed_by_user_id == user_id,
        Book.is_borrowed == True
    ).order_by(desc(Book.created_at)).limit(limit).all()


def find_user_by_full_name(db: Session, full_name: str) -> Optional[dict]:
    """
    Find a registered user by their full name.
    
    Since users are managed by Supabase, we search for users who have
    uploaded books (their full name is stored in listed_by).
    
    Returns dict with user_id and full_name if found, None otherwise.
    """
    # Search for a book uploaded by someone with this name
    # This identifies registered users who have uploaded at least one book
    book = db.query(Book).filter(
        Book.listed_by.ilike(full_name)  # Case-insensitive match
    ).first()
    
    if book and book.user_id and book.listed_by:
        return {
            "user_id": book.user_id,
            "full_name": book.listed_by
        }
    
    return None


def mark_book_as_borrowed(
    db: Session, 
    book_id: int, 
    borrowed_by_user_id: str, 
    borrowed_by_name: str
) -> Optional[Book]:
    """
    Mark a book as borrowed by a specific user.
    
    Business Rules (enforced in API layer):
    - Only the book uploader can call this
    - Book must not already be borrowed
    - Borrower must be a registered user
    
    This function only handles the database mutation.
    """
    book = get_book_by_id(db, book_id)
    if book:
        book.is_borrowed = True
        book.borrowed_by_user_id = borrowed_by_user_id
        book.borrowed_by_name = borrowed_by_name
        db.commit()
        db.refresh(book)
    return book