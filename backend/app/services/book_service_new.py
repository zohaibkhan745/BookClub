"""
Book service for business logic related to books.

Refactored to:
- Use new Book model with owner_id/owner_full_name
- Remove is_borrowed handling (now in borrow_service)
- Use is_active instead of is_available
- Added caching for better performance
"""
from sqlalchemy.orm import Session, joinedload, load_only
from sqlalchemy import desc, func
from typing import Optional, List
from datetime import datetime
import uuid
import logging

from app.models import Book, BorrowRecord
from app.schemas import BookCreate, BookUpdate
from app.cache import cache, invalidate_books_cache, invalidate_user_cache

logger = logging.getLogger(__name__)

# Cache TTL constants (in seconds)
CACHE_TTL_SHORT = 60      # 1 minute for frequently changing data
CACHE_TTL_MEDIUM = 120    # 2 minutes for section data
CACHE_TTL_LONG = 300      # 5 minutes for individual book details


def get_all_books(db: Session, limit: int = 50) -> List[Book]:
    """Fetch all books with caching (including borrowed ones).
    
    Optimizations:
    - Uses index on created_at
    - Limits results early to reduce memory usage
    """
    cache_key = f"books:all:{limit}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    # Show all books, including borrowed ones (is_available=False)
    result = db.query(Book).order_by(desc(Book.created_at)).limit(limit).all()
    
    cache.set(cache_key, result, ttl_seconds=CACHE_TTL_SHORT)
    return result


def get_book_by_id(db: Session, book_id) -> Optional[Book]:
    """Fetch a single book by ID with caching (accepts string or int)."""
    try:
        book_id_int = int(book_id)
    except (ValueError, TypeError):
        return None
    
    cache_key = f"books:id:{book_id_int}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    result = db.query(Book).filter(Book.id == book_id_int).first()
    if result:
        cache.set(cache_key, result, ttl_seconds=CACHE_TTL_LONG)
    return result


def get_books_by_genre(db: Session, genre: str, limit: int = 50) -> List[Book]:
    """Fetch all books by genre/category with caching (including borrowed).
    
    Optimizations:
    - Uses index on category
    - Case-insensitive match with ilike for flexibility
    """
    cache_key = f"genre:{genre.lower()}:{limit}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    # Show all books in genre, including borrowed ones
    result = db.query(Book).filter(
        Book.category.ilike(f"%{genre}%")
    ).order_by(desc(Book.created_at)).limit(limit).all()
    
    cache.set(cache_key, result, ttl_seconds=CACHE_TTL_SHORT)
    return result


def get_books_by_section(db: Session, limit: int = 10) -> dict:
    """
    Get books organized by homepage sections with caching.
    Shows all books including borrowed ones.
    - trending: Most recent books
    - newArrivals: Latest additions
    - popular: Random selection (simulated popularity)
    """
    cache_key = f"books:sections:{limit}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    # Show all books, including borrowed ones
    all_books = db.query(Book).order_by(desc(Book.created_at)).limit(30).all()
    
    # Split books into sections
    trending = all_books[:limit] if len(all_books) >= limit else all_books
    new_arrivals = all_books[limit:limit*2] if len(all_books) >= limit*2 else all_books[:limit]
    popular = all_books[limit*2:limit*3] if len(all_books) >= limit*3 else all_books[:limit]
    
    result = {
        "trending": trending,
        "newArrivals": new_arrivals,
        "popular": popular,
    }
    
    cache.set(cache_key, result, ttl_seconds=CACHE_TTL_MEDIUM)
    return result


def create_book(
    db: Session,
    book_data: BookCreate,
    owner_id: str,
    owner_full_name: str
) -> Book:
    """
    Create a new book listing.
    
    Args:
        db: Database session
        book_data: Book creation data
        owner_id: ID of the owner (from authenticated user)
        owner_full_name: Full name of the owner (from authenticated user)
    
    Security Note:
        owner_id and owner_full_name must be set by the API layer from
        the authenticated user context. These are never accepted from
        client input to prevent spoofing.
    
    Returns:
        Created Book instance
    """
    db_book = Book(
        title=book_data.title,
        author=book_data.author,
        category=book_data.category,
        listing_type=book_data.listing_type.value if book_data.listing_type else "lend",
        condition=book_data.condition.value if book_data.condition else "good",
        description=book_data.description,
        cover_image=book_data.cover_image,
        price=book_data.price,
        whatsapp_number=book_data.whatsapp_number,
        is_available=True,
        # Ownership derived from authenticated user - never from frontend
        user_id=owner_id,
        listed_by=owner_full_name,
    )
    
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    
    return db_book


def update_book(
    db: Session,
    book_id: str,
    book_data: BookUpdate,
    user_id: str
) -> Optional[Book]:
    """
    Update a book listing.
    
    Args:
        db: Database session
        book_id: ID of the book to update
        book_data: Update data
        user_id: ID of the user making the update
    
    Returns:
        Updated Book instance or None if not found/unauthorized
    """
    book = get_book_by_id(db, book_id)
    
    if not book:
        return None
    
    # Verify ownership
    if book.user_id != user_id:
        raise PermissionError("Only the book owner can update this book")
    
    # Update fields if provided
    update_data = book_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if hasattr(book, field):
            # Handle enum values
            if hasattr(value, 'value'):
                value = value.value
            setattr(book, field, value)
    
    db.commit()
    db.refresh(book)
    
    return book


def soft_delete_book(db: Session, book_id: str, user_id: str) -> bool:
    """
    Delete a book from the database.
    
    Args:
        db: Database session
        book_id: ID of the book to delete
        user_id: ID of the user making the request
    
    Returns:
        True if deleted, False if not found/unauthorized
    """
    book = get_book_by_id(db, book_id)
    
    if not book:
        return False
    
    # Verify ownership
    if book.user_id != user_id:
        raise PermissionError("Only the book owner can delete this book")
    
    # Store owner_id for cache invalidation
    owner_id = book.user_id
    book_id_int = book.id
    
    # Actually delete the book from database
    db.delete(book)
    db.commit()
    
    # Invalidate caches
    invalidate_books_cache()
    cache.delete(f"books:id:{book_id_int}")
    if owner_id:
        invalidate_user_cache(owner_id)
    
    logger.info(f"Deleted book {book_id_int} and invalidated caches")
    return True


def get_books_by_owner(db: Session, owner_id: str, limit: int = 50) -> List[Book]:
    """Fetch all books uploaded by a specific user with caching."""
    cache_key = f"user:{owner_id}:books:{limit}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    result = db.query(Book).filter(
        Book.user_id == owner_id
    ).order_by(desc(Book.created_at)).limit(limit).all()
    
    cache.set(cache_key, result, ttl_seconds=CACHE_TTL_SHORT)
    return result


def search_books(
    db: Session,
    query: str,
    category: Optional[str] = None,
    limit: int = 50
) -> List[Book]:
    """
    Search books by title or author.
    
    Args:
        db: Database session
        query: Search query
        category: Optional category filter
        limit: Maximum results
    
    Returns:
        List of matching books
    """
    q = db.query(Book)
    
    if query:
        search_term = f"%{query}%"
        q = q.filter(
            (Book.title.ilike(search_term)) |
            (Book.author.ilike(search_term))
        )
    
    if category:
        q = q.filter(Book.category.ilike(f"%{category}%"))
    
    return q.order_by(desc(Book.created_at)).limit(limit).all()


# ============================================
# Legacy Functions for Backwards Compatibility
# ============================================

def get_books_by_user(db: Session, user_id: str, limit: int = 50) -> List[Book]:
    """
    Alias for get_books_by_owner.
    Kept for backwards compatibility.
    """
    return get_books_by_owner(db, user_id, limit)


def update_book_availability(db: Session, book_id: str, available: bool) -> Optional[Book]:
    """
    Update book availability.
    """
    book = get_book_by_id(db, book_id)
    if book:
        book.is_available = available
        db.commit()
        db.refresh(book)
    return book
