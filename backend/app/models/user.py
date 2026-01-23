"""
User model for local user storage.

Note: Authentication is handled by Supabase. This table stores additional
user metadata and enables relationships with other tables (books, borrow_records).
The user ID here maps to Supabase's auth.users.id.
"""
from sqlalchemy import Column, String, DateTime, Index, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import uuid


def generate_uuid():
    """Generate a UUID string for new users."""
    return str(uuid.uuid4())


class User(Base):
    """
    User model for book club members.
    
    This table syncs with Supabase auth but allows local relationships.
    - id: Matches Supabase auth.users.id (UUID)
    - username: Unique username for display
    - full_name: User's display name
    - email: User's email (unique, synced from Supabase)
    
    Security Note:
    - Password authentication is handled by Supabase
    - password_hash is stored here only if local auth is added later
    """
    
    __tablename__ = "users"
    
    # Primary key - UUID matching Supabase auth.users.id
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # User identity
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    
    # Password hash - for future local auth support
    # Currently authentication is via Supabase
    password_hash = Column(String(255), nullable=True)
    
    # Credit system - users earn credits by uploading books
    # Default is 1 credit to allow first borrow
    credits = Column(Integer, default=1, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    # Books uploaded by this user (using user_id column in books table)
    books = relationship("Book", back_populates="owner", foreign_keys="Book.user_id", primaryjoin="User.id==Book.user_id")
    
    # Borrow records where this user is the borrower
    borrow_records = relationship("BorrowRecord", back_populates="borrower", foreign_keys="BorrowRecord.borrower_id")
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"
    
    # Composite index for common queries
    __table_args__ = (
        Index('ix_users_email_username', 'email', 'username'),
    )
