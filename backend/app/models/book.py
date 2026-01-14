from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum
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
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    listing_type = Column(String(20), nullable=False, default=ListingType.lend.value)
    condition = Column(String(20), nullable=True, default=BookCondition.good.value)
    description = Column(Text, nullable=True)
    cover_image = Column(String(500), nullable=True)
    price = Column(String(50), nullable=True)  # Only for sell listings
    whatsapp_number = Column(String(20), nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
