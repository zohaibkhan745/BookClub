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
    """
    Schema for creating a new book.
    
    Note: uploadedByUserId and uploadedByFullName are NOT accepted from frontend.
    These are always derived from the authenticated user on the backend
    to ensure data integrity and security.
    """
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    listing_type: ListingType
    condition: Optional[BookCondition] = BookCondition.good
    description: Optional[str] = None
    cover_image: Optional[str] = None
    price: Optional[str] = None
    whatsapp_number: Optional[str] = None
    # Internal fields - set by backend from authenticated user, never from frontend input
    user_id: Optional[str] = None
    listed_by: Optional[str] = None


# ============================================
# Response Schemas
# ============================================

class BookPreview(BaseModel):
    """Minimal book info for list views."""
    id: int
    title: str
    author: str
    image: str
    is_available: bool = True  # Whether book is available for borrowing
    
    class Config:
        from_attributes = True


class BookResponse(BaseModel):
    """Full book details for public display."""
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
    # Public attribution - shows uploader's full name, never their email
    listedBy: Optional[str] = None  # Format: "Listed by {uploadedByFullName}"
    # Ownership info for conditional UI rendering
    uploadedByUserId: Optional[str] = None  # Used to check if current user is the uploader
    # Borrowing status
    isBorrowed: bool = False
    borrowedByName: Optional[str] = None  # Name of the person who borrowed the book
    borrowedByUserId: Optional[str] = None  # Borrower's user ID (for library display)
    
    class Config:
        from_attributes = True


class BookSectionsResponse(BaseModel):
    """Homepage sections response."""
    trending: list[BookPreview]
    newArrivals: list[BookPreview]
    popular: list[BookPreview]


class MarkBorrowedRequest(BaseModel):
    """Request schema for marking a book as borrowed."""
    borrower_full_name: str = Field(..., min_length=1, max_length=255, description="Full name of the borrower")


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
