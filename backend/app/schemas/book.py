from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ListingType(str, Enum):
    lend = "lend"
    borrow = "borrow"
    sell = "sell"


class BookCondition(str, Enum):
    new = "new"
    like_new = "like-new"
    good = "good"
    fair = "fair"
    poor = "poor"


# ============================================
# Request Schemas
# ============================================

class BookCreate(BaseModel):
    """Schema for creating a new book."""
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    listing_type: ListingType
    condition: Optional[BookCondition] = BookCondition.good
    description: Optional[str] = None
    cover_image: Optional[str] = None
    price: Optional[str] = None
    whatsapp_number: Optional[str] = None


# ============================================
# Response Schemas
# ============================================

class BookPreview(BaseModel):
    """Minimal book info for list views."""
    id: int
    title: str
    author: str
    image: str
    
    class Config:
        from_attributes = True


class BookResponse(BaseModel):
    """Full book details."""
    id: int
    title: str
    author: str
    genre: str  # Maps from category
    image: str
    description: Optional[str] = ""
    year: str
    pages: int = 0
    language: str = "English"
    rating: int = 0
    
    class Config:
        from_attributes = True


class BookSectionsResponse(BaseModel):
    """Homepage sections response."""
    trending: list[BookPreview]
    newArrivals: list[BookPreview]
    popular: list[BookPreview]


# ============================================
# API Response Wrappers
# ============================================

class SuccessResponse(BaseModel):
    """Standard success response."""
    success: bool = True
    data: dict | list | None = None


class ErrorDetail(BaseModel):
    """Field-level error detail."""
    field: str
    message: str


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: dict
