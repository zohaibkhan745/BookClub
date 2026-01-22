"""
Borrow API endpoints for book borrowing/returning.

Key Design:
- Borrow status is NOT stored in books table
- BorrowRecord table tracks all borrows
- A book is "borrowed" if returned_at IS NULL
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.db.database import get_db
from app.services import book_service, borrow_service, user_service
from app.schemas import (
    BorrowBookRequest,
    OwnerBorrowRequest,
    ReturnBookRequest,
    BorrowRecordResponse,
)
from app.auth import get_current_user, AuthUser

router = APIRouter(prefix="/api/v1/borrow", tags=["borrow"])


def borrow_record_to_response(record, include_book: bool = False) -> dict:
    """Convert BorrowRecord to API response format."""
    response = {
        "id": str(record.id),
        "bookId": str(record.book_id),
        "borrowerId": str(record.borrower_id),
        "borrowedAt": record.borrowed_at.isoformat() if record.borrowed_at else None,
        "dueAt": record.due_at.isoformat() if record.due_at else None,
        "returnedAt": record.returned_at.isoformat() if record.returned_at else None,
        "status": record.status,
    }
    
    # Include borrower info if loaded
    if record.borrower:
        response["borrower"] = {
            "id": str(record.borrower.id),
            "username": record.borrower.username,
            "fullName": record.borrower.full_name,
        }
    
    # Include book info if requested and loaded
    if include_book and record.book:
        response["book"] = {
            "id": str(record.book.id),
            "title": record.book.title,
            "author": record.book.author,
            "image": record.book.cover_image or "",
        }
    
    return response


@router.post("/request")
async def request_to_borrow(
    request: BorrowBookRequest,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    POST /borrow/request - Request to borrow a book.
    
    Creates a borrow request with status='REQUESTED'.
    The book owner must approve the request.
    """
    try:
        # Ensure user exists in local DB
        db_user = user_service.get_user_by_id(db, user.id)
        if not db_user:
            db_user = user_service.sync_supabase_user(
                db,
                supabase_id=user.id,
                email=user.email or "",
                full_name=user.full_name or "User"
            )
        
        # Create borrow request (status=REQUESTED)
        borrow_record = borrow_service.request_to_borrow(
            db=db,
            book_id=request.book_id,
            borrower_id=user.id,
        )
        
        # Get book's WhatsApp number for redirect
        book = book_service.get_book_by_id(db, request.book_id)
        whatsapp_number = book.whatsapp_number if book else None
        
        response_data = borrow_record_to_response(borrow_record)
        response_data["whatsappNumber"] = whatsapp_number
        
        return {
            "success": True,
            "data": response_data
        }
    
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": error_msg}
            )
        elif "already have a pending" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "ALREADY_REQUESTED", "message": error_msg}
            )
        elif "own book" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "OWN_BOOK", "message": error_msg}
            )
        elif "not available" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "NOT_AVAILABLE", "message": error_msg}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "REQUEST_FAILED", "message": error_msg}
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@router.get("/requests/{book_id}")
async def get_book_requests(
    book_id: str,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    GET /borrow/requests/{book_id} - Get all pending borrow requests for a book.
    
    Only the book owner can see the requests.
    """
    # Verify book exists and user is owner
    book = book_service.get_book_by_id(db, book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BOOK_NOT_FOUND", "message": "Book not found"}
        )
    
    if book.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "NOT_AUTHORIZED", "message": "Only the book owner can view requests"}
        )
    
    requests = borrow_service.get_pending_requests_for_book(db, book_id)
    
    return {
        "success": True,
        "data": [borrow_record_to_response(r) for r in requests]
    }


@router.post("/approve/{request_id}")
async def approve_request(
    request_id: str,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    POST /borrow/approve/{request_id} - Approve a borrow request.
    
    Changes status to BORROWED and marks book as unavailable.
    Only the book owner can approve.
    """
    try:
        borrow_record = borrow_service.approve_borrow_request(
            db=db,
            request_id=request_id,
            owner_id=user.id
        )
        
        return {
            "success": True,
            "data": borrow_record_to_response(borrow_record)
        }
    
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": error_msg}
            )
        elif "not authorized" in error_msg.lower() or "only the book owner" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "NOT_AUTHORIZED", "message": error_msg}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "APPROVE_FAILED", "message": error_msg}
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@router.post("/cancel/{request_id}")
async def cancel_request(
    request_id: str,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    POST /borrow/cancel/{request_id} - Cancel a borrow request.
    
    Can be done by the requester or the book owner.
    """
    try:
        borrow_record = borrow_service.cancel_borrow_request(
            db=db,
            request_id=request_id,
            user_id=user.id
        )
        
        return {
            "success": True,
            "data": borrow_record_to_response(borrow_record)
        }
    
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "NOT_FOUND", "message": error_msg}
            )
        elif "not authorized" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "NOT_AUTHORIZED", "message": error_msg}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CANCEL_FAILED", "message": error_msg}
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@router.post("/mark-borrowed")
async def owner_mark_borrowed(
    request: OwnerBorrowRequest,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    POST /borrow/mark-borrowed - Book owner marks their book as borrowed by someone.
    
    Authorization:
    - User must be the book owner
    - Borrower must be a registered user (found by username)
    - Book must not be currently borrowed
    """
    # Verify book exists and user is the owner
    book = book_service.get_book_by_id(db, request.book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BOOK_NOT_FOUND", "message": "Book not found"}
        )
    
    if book.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "NOT_AUTHORIZED", "message": "Only the book owner can mark it as borrowed"}
        )
    
    # Find the borrower by username
    borrower = user_service.get_user_by_username(db, request.borrower_username)
    
    if not borrower:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "BORROWER_NOT_FOUND",
                "message": f"User '{request.borrower_username}' not found. The borrower must have an account."
            }
        )
    
    try:
        # Create borrow record
        borrow_record = borrow_service.borrow_book(
            db=db,
            book_id=request.book_id,
            borrower_id=borrower.id,
            due_at=request.due_at
        )
        
        return {
            "success": True,
            "data": borrow_record_to_response(borrow_record)
        }
    
    except ValueError as e:
        error_msg = str(e)
        if "already borrowed" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "ALREADY_BORROWED", "message": "This book is already borrowed"}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "BORROW_FAILED", "message": error_msg}
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@router.post("/return")
async def return_book(
    request: ReturnBookRequest,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    POST /borrow/return - Return a borrowed book.
    
    Can be initiated by:
    - The borrower themselves
    - The book owner
    """
    try:
        borrow_record = borrow_service.return_book(
            db=db,
            book_id=request.book_id,
            user_id=user.id
        )
        
        return {
            "success": True,
            "data": borrow_record_to_response(borrow_record)
        }
    
    except ValueError as e:
        error_msg = str(e)
        if "not currently borrowed" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "NOT_BORROWED", "message": "This book is not currently borrowed"}
            )
        elif "only the borrower" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "NOT_AUTHORIZED", "message": error_msg}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "RETURN_FAILED", "message": error_msg}
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@router.get("/status/{book_id}")
async def get_borrow_status(book_id: str, db: Session = Depends(get_db)):
    """
    GET /borrow/status/{book_id} - Get the borrow status of a book.
    
    Public endpoint - no auth required.
    """
    book = book_service.get_book_by_id(db, book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BOOK_NOT_FOUND", "message": "Book not found"}
        )
    
    borrow_status = borrow_service.get_borrow_status(db, book_id)
    
    return {
        "success": True,
        "data": {
            "bookId": book_id,
            "isBorrowed": borrow_status["is_borrowed"],
            "borrowerName": borrow_status["borrower_name"],
            "borrowerId": borrow_status["borrower_id"],
            "dueAt": borrow_status["due_at"].isoformat() if borrow_status["due_at"] else None,
        }
    }


@router.get("/history/book/{book_id}")
async def get_book_borrow_history(
    book_id: str,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    GET /borrow/history/book/{book_id} - Get borrow history for a book.
    
    Only the book owner can see the full history.
    """
    book = book_service.get_book_by_id(db, book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BOOK_NOT_FOUND", "message": "Book not found"}
        )
    
    # Only owner can see history
    if book.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "NOT_AUTHORIZED", "message": "Only the book owner can view borrow history"}
        )
    
    history = borrow_service.get_book_borrow_history(db, book_id)
    
    return {
        "success": True,
        "data": [borrow_record_to_response(r) for r in history]
    }


@router.get("/history/my")
async def get_my_borrow_history(
    include_returned: bool = True,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    GET /borrow/history/my - Get the current user's borrow history.
    """
    history = borrow_service.get_user_borrow_history(
        db,
        user.id,
        include_returned=include_returned
    )
    
    return {
        "success": True,
        "data": [borrow_record_to_response(r, include_book=True) for r in history]
    }
