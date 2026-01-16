from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.db.database import get_db
from app.services import borrow_service, book_service
from app.auth import get_current_user, AuthUser

router = APIRouter(prefix="/api/v1", tags=["borrow"])


class BorrowRequest(BaseModel):
    """Borrow request schema."""
    bookId: int
    borrowerName: str = Field(..., min_length=1, max_length=100)
    borrowerEmail: str = Field(..., min_length=1)
    borrowerPhone: str = Field(..., min_length=1)
    message: Optional[str] = None


@router.post("/borrow", status_code=status.HTTP_201_CREATED)
async def create_borrow_request(
    request: BorrowRequest,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    POST /borrow - Submit a request to borrow a book.
    Requires authentication.
    """
    # Validate email format
    import re
    email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    
    errors = []
    
    if not request.borrowerName or not request.borrowerName.strip():
        errors.append({"field": "borrowerName", "message": "Name is required"})
    if not request.borrowerEmail or not request.borrowerEmail.strip():
        errors.append({"field": "borrowerEmail", "message": "Email is required"})
    elif not re.match(email_pattern, request.borrowerEmail):
        errors.append({"field": "borrowerEmail", "message": "Invalid email format"})
    if not request.borrowerPhone or not request.borrowerPhone.strip():
        errors.append({"field": "borrowerPhone", "message": "Phone number is required"})
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Validation failed", "details": errors}
        )
    
    # Check if book exists
    book = book_service.get_book_by_id(db, request.bookId)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BOOK_NOT_FOUND", "message": f"Book with ID {request.bookId} not found."}
        )
    
    # Create borrow request
    result = borrow_service.create_borrow_request(
        db=db,
        book_id=request.bookId,
        borrower_name=request.borrowerName,
        borrower_email=request.borrowerEmail,
        borrower_phone=request.borrowerPhone,
        message=request.message
    )
    
    return {
        "success": True,
        "data": result
    }
