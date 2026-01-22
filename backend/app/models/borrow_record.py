"""
BorrowRecord model for tracking book borrowings.

This model implements the many-to-many relationship between users and books
through borrowing transactions. A book is considered "currently borrowed"
if there exists a borrow_record where returned_at IS NULL.
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum
import uuid


def generate_uuid():
    """Generate a UUID string for new borrow records."""
    return str(uuid.uuid4())


class BorrowStatus(str, enum.Enum):
    """Status of a borrow record."""
    requested = "requested"  # User has requested to borrow (pending owner approval)
    borrowed = "borrowed"    # Book is currently borrowed (approved by owner)
    returned = "returned"    # Book has been returned
    overdue = "overdue"      # Book is overdue (past due_at date)
    cancelled = "cancelled"  # Request was cancelled or rejected


class BorrowRecord(Base):
    """
    BorrowRecord model tracking book borrowing history.
    
    Key Design Decision:
    - A book's "borrowed" status is NOT stored on the book itself
    - Instead, check for borrow_records where returned_at IS NULL
    - This provides full audit history and avoids data duplication
    
    Status Flow:
    1. User borrows book → status='borrowed', returned_at=NULL
    2. Book becomes overdue → status='overdue' (via scheduled job or on-read)
    3. User returns book → status='returned', returned_at=NOW()
    """
    
    __tablename__ = "borrow_records"
    
    # Primary key - UUID
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Foreign keys (book_id is Integer to match books.id)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    borrower_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Timestamps
    borrowed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    due_at = Column(DateTime(timezone=True), nullable=True)  # Optional due date
    returned_at = Column(DateTime(timezone=True), nullable=True)  # NULL means currently borrowed
    
    # Status - derived from timestamps but cached for query efficiency
    status = Column(
        String(20),
        nullable=False,
        default=BorrowStatus.borrowed.value,
        index=True
    )
    
    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    book = relationship("Book", back_populates="borrow_records")
    borrower = relationship("User", back_populates="borrow_records", foreign_keys=[borrower_id])
    
    def __repr__(self):
        return f"<BorrowRecord(id={self.id}, book_id={self.book_id}, borrower_id={self.borrower_id}, status={self.status})>"
    
    # Indexes for common queries - optimized for actual query patterns
    __table_args__ = (
        # Primary index for get_active_borrow_for_book() - most frequently used query
        # Covers: WHERE book_id = ? AND returned_at IS NULL AND status = 'borrowed'
        Index('ix_borrow_records_active_v2', 'book_id', 'status', 'returned_at'),
        
        # Index for user's borrow history - ORDER BY borrowed_at DESC
        Index('ix_borrow_records_user_history', 'borrower_id', 'borrowed_at'),
        
        # Index for pending requests lookup - get_pending_requests_for_book()
        Index('ix_borrow_records_pending', 'book_id', 'status', 'created_at'),
        
        # Index for overdue check - update_overdue_status() bulk update
        Index('ix_borrow_records_overdue', 'status', 'due_at', 'returned_at'),
    )
