"""
BorrowRecord schemas for API request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class BorrowStatus(str, Enum):
    """Status of a borrow record."""
    borrowed = "borrowed"
    returned = "returned"
    overdue = "overdue"


# ============================================
# Request Schemas
# ============================================

class BorrowBookRequest(BaseModel):
    """
    Schema for borrowing a book.
    
    Note: borrower_id is derived from the authenticated user.
    Only the book owner can initiate a borrow on behalf of someone,
    or users borrow for themselves.
    """
    book_id: str = Field(..., description="ID of the book to borrow")
    due_at: Optional[datetime] = Field(None, description="Optional due date for return")
    
    class Config:
        json_schema_extra = {
            "example": {
                "book_id": "123e4567-e89b-12d3-a456-426614174000",
                "due_at": "2026-02-18T23:59:59Z"
            }
        }


class OwnerBorrowRequest(BaseModel):
    """
    Schema for book owner marking a book as borrowed by someone.
    Only the book owner can use this endpoint.
    """
    book_id: str = Field(..., description="ID of the book to mark as borrowed")
    borrower_username: str = Field(..., min_length=1, description="Username of the borrower")
    due_at: Optional[datetime] = Field(None, description="Optional due date for return")
    
    class Config:
        json_schema_extra = {
            "example": {
                "book_id": "123e4567-e89b-12d3-a456-426614174000",
                "borrower_username": "janedoe",
                "due_at": "2026-02-18T23:59:59Z"
            }
        }


class ReturnBookRequest(BaseModel):
    """Schema for returning a borrowed book."""
    book_id: str = Field(..., description="ID of the book to return")
    
    class Config:
        json_schema_extra = {
            "example": {
                "book_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


# ============================================
# Response Schemas
# ============================================

class BorrowerInfo(BaseModel):
    """Borrower information for display."""
    id: str
    username: str
    full_name: str
    
    class Config:
        from_attributes = True


class BorrowRecordResponse(BaseModel):
    """Full borrow record details."""
    id: str
    book_id: str
    borrower_id: str
    borrower: Optional[BorrowerInfo] = None
    borrowed_at: datetime
    due_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    status: BorrowStatus
    
    class Config:
        from_attributes = True


class BorrowRecordPreview(BaseModel):
    """Minimal borrow record info for lists."""
    id: str
    book_id: str
    borrower_name: str
    borrowed_at: datetime
    due_at: Optional[datetime] = None
    status: BorrowStatus
    
    class Config:
        from_attributes = True


class BookBorrowStatus(BaseModel):
    """
    Borrow status information for a book.
    Used in book detail responses.
    """
    is_borrowed: bool
    current_borrow: Optional[BorrowRecordResponse] = None
    borrower_name: Optional[str] = None
    due_at: Optional[datetime] = None
