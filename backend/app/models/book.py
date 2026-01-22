from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, Index
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class ListingType(str, enum.Enum):
    """Type of book listing."""
    lend = "lend"
    borrow = "borrow"
    sell = "sell"


class BookCondition(str, enum.Enum):
    """Physical condition of the book."""
    new = "new"
    like_new = "like-new"
    good = "good"
    fair = "fair"
    poor = "poor"


class Book(Base):
    """Book model representing a book listing."""
    
    __tablename__ = "books"
    __table_args__ = (
        # Composite indexes for common query patterns
        Index('idx_books_available_created', 'is_available', 'created_at'),
        Index('idx_books_category_available', 'category', 'is_available'),
        Index('idx_books_listing_available', 'listing_type', 'is_available'),
        # Index for owner's books lookup - get_books_by_owner()
        Index('idx_books_owner_created', 'user_id', 'created_at'),
        {'extend_existing': True},  # Allow redefining if metadata already exists
    )
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)  # Added index
    category = Column(String(100), nullable=False, index=True)  # Added index
    listing_type = Column(String(20), nullable=False, default=ListingType.lend.value, index=True)  # Added index
    condition = Column(String(20), nullable=True, default=BookCondition.good.value)
    description = Column(Text, nullable=True)
    cover_image = Column(Text, nullable=True)  # Changed to Text for base64 images
    price = Column(String(50), nullable=True)  # Only for sell listings
    whatsapp_number = Column(String(20), nullable=True)
    is_available = Column(Boolean, default=True, index=True)  # Added index
    
    # Book ownership fields - IMPORTANT: These are set by the backend from the authenticated user,
    # never from frontend input. This ensures data integrity and prevents spoofing.
    user_id = Column(String(36), nullable=True, index=True)  # Supabase user UUID
    listed_by = Column(String(255), nullable=True)  # User's full name for public display (email is never stored here)
    
    # Borrowing fields - Track who has borrowed this book
    # These are set by the backend when the uploader marks the book as borrowed
    is_borrowed = Column(Boolean, default=False)  # Whether the book is currently borrowed
    borrowed_by_user_id = Column(String(36), nullable=True, index=True)  # Borrower's Supabase user UUID
    borrowed_by_name = Column(String(255), nullable=True)  # Borrower's full name for display
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
