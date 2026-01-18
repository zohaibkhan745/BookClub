"""
Book model representing a book listing.

Refactored Design:
- Removed is_borrowed, borrowed_by_user_id, borrowed_by_name columns
- Borrow status is now determined by BorrowRecord table
- A book is "borrowed" if there's a BorrowRecord with returned_at IS NULL
- Uses existing database columns for compatibility
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Index, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class ListingType(str, enum.Enum):
    """Type of book listing."""
    lend = "lend"
    borrow = "borrow"
    sell = "sell"
    exchange = "exchange"


class BookCondition(str, enum.Enum):
    """Physical condition of the book."""
    new = "new"
    like_new = "like-new"
    good = "good"
    fair = "fair"
    poor = "poor"


class Book(Base):
    """
    Book model representing a book listing.
    
    Key Design Changes:
    - Removed: is_borrowed, borrowed_by_user_id, borrowed_by_name
      (borrow status determined via BorrowRecord table)
    - Uses existing column names for database compatibility
    """
    
    __tablename__ = "books"
    
    # Primary key - Integer (existing schema)
    id = Column(Integer, primary_key=True, index=True)
    
    # Book metadata
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    
    # Listing details
    listing_type = Column(String(20), nullable=False, default=ListingType.lend.value)
    condition = Column(String(20), nullable=True, default=BookCondition.good.value)
    description = Column(Text, nullable=True)
    cover_image = Column(Text, nullable=True)  # Base64 or URL
    price = Column(String(50), nullable=True)  # Only for sell listings
    
    # Contact info
    whatsapp_number = Column(String(20), nullable=True)
    
    # Availability - book is hidden but not deleted
    is_available = Column(Boolean, default=True, index=True)
    
    # Owner info (using existing column names)
    user_id = Column(String(36), nullable=True, index=True)  # Owner's Supabase UUID
    listed_by = Column(String(255), nullable=True)  # Owner's full name for display
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="books", foreign_keys=[user_id], primaryjoin="Book.user_id==User.id")
    borrow_records = relationship("BorrowRecord", back_populates="book", cascade="all, delete-orphan")
    
    # Property aliases for new naming convention
    @property
    def owner_id(self) -> str:
        """Alias for user_id."""
        return self.user_id
    
    @property
    def owner_full_name(self) -> str:
        """Alias for listed_by."""
        return self.listed_by
    
    @property
    def is_active(self) -> bool:
        """Alias for is_available."""
        return self.is_available
    
    def __repr__(self):
        return f"<Book(id={self.id}, title={self.title}, author={self.author})>"
    
    @property
    def is_currently_borrowed(self) -> bool:
        """
        Check if the book is currently borrowed.
        A book is borrowed if there's a BorrowRecord with returned_at IS NULL.
        
        Note: This property requires the borrow_records relationship to be loaded.
        For bulk queries, use a joined query instead.
        """
        return any(br.returned_at is None for br in self.borrow_records)
    
    @property
    def current_borrower(self):
        """
        Get the current borrower if the book is borrowed.
        Returns the BorrowRecord with returned_at IS NULL, or None.
        """
        for br in self.borrow_records:
            if br.returned_at is None:
                return br
        return None

