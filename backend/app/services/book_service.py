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
    """Create a new book listing."""
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
