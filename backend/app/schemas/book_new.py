"""
Book schemas for API request/response validation.

Refactored to:
- Remove is_borrowed fields (derived from borrow_records)
- Use owner_id/owner_full_name instead of user_id/listed_by
- Use is_active instead of is_available
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ListingType(str, Enum):
    """Type of book listing."""
    lend = "lend"
    borrow = "borrow"
    sell = "sell"
    exchange = "exchange"


class BookCondition(str, Enum):
    """Physical condition of the book."""
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
    
    Note: owner_id and owner_full_name are NOT accepted from frontend.
    These are always derived from the authenticated user on the backend.
    """
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    listing_type: ListingType = ListingType.lend
    condition: Optional[BookCondition] = BookCondition.good
    description: Optional[str] = None
    cover_image: Optional[str] = None
    price: Optional[str] = None
    whatsapp_number: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "category": "Fiction",
                "listing_type": "lend",
                "condition": "good",
                "description": "Classic American novel",
                "price": None,
                "whatsapp_number": "+1234567890"
            }
        }


class BookUpdate(BaseModel):
    """Schema for updating a book."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    listing_type: Optional[ListingType] = None
    condition: Optional[BookCondition] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    price: Optional[str] = None
    whatsapp_number: Optional[str] = None
    is_active: Optional[bool] = None


# ============================================
# Response Schemas
# ============================================

class BookOwnerInfo(BaseModel):
    """Owner information for book display."""
    id: str
    username: str
    full_name: str
    
    class Config:
        from_attributes = True


class BorrowStatusInfo(BaseModel):
    """
    Borrow status information embedded in book response.
    Derived from borrow_records, NOT stored in books table.
    """
    is_borrowed: bool = False
    borrower_name: Optional[str] = None
    borrower_id: Optional[str] = None
    due_at: Optional[datetime] = None


class BookPreview(BaseModel):
    """Minimal book info for list views and carousels."""
    id: str
    title: str
    author: str
    image: str
    is_available: bool = True  # Whether book is available for borrowing
    
    class Config:
        from_attributes = True


class BookResponse(BaseModel):
    """
    Full book details for public display.
    
    Key Changes:
    - Borrow status is computed from borrow_records, not stored in books
    - Uses owner_full_name instead of listed_by
    - Uses is_active instead of is_available
    """
    id: str
    title: str
    author: str
    genre: str  # Maps from category
    image: str
    description: Optional[str] = ""
    year: str  # Derived from created_at
    pages: int = 0
    language: str = "English"
    rating: int = 5
    listing_type: str = "lend"
    condition: Optional[str] = "good"
    price: Optional[str] = None
    whatsapp_number: Optional[str] = None
    
    # Owner info
    owner_id: Optional[str] = None
    owner_full_name: Optional[str] = None
    listed_by: Optional[str] = None  # Alias for owner_full_name (backwards compat)
    
    # Borrow status - computed from borrow_records
    borrow_status: BorrowStatusInfo = BorrowStatusInfo()
    
    # Legacy fields for backwards compatibility
    is_borrowed: bool = False
    borrower_name: Optional[str] = None
    borrower_id: Optional[str] = None
    
    # For frontend conditional rendering
    uploaded_by_user_id: Optional[str] = None  # Alias for owner_id
    
    class Config:
        from_attributes = True


class BookSectionsResponse(BaseModel):
    """Homepage sections response."""
    trending: List[BookPreview]
    newArrivals: List[BookPreview]
    popular: List[BookPreview]


class UserLibraryResponse(BaseModel):
    """User's library - uploaded and borrowed books."""
    uploaded: List[BookResponse]
    borrowed: List[BookResponse]


# ============================================
# API Response Wrappers
# ============================================

class SuccessResponse(BaseModel):
    """Standard success response wrapper."""
    success: bool = True
    data: dict


class ErrorDetail(BaseModel):
    """Error detail with field information."""
    field: str
    message: str


class ErrorResponse(BaseModel):
    """Standard error response wrapper."""
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None
