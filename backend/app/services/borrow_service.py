from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.book import Book
from app.schemas.book import BookCreate
from typing import Optional
from datetime import datetime


class BorrowRequest:
    """In-memory borrow request (no separate table for MVP)."""
    def __init__(self, request_id: str, book_id: int, status: str, created_at: str):
        self.request_id = request_id
        self.book_id = book_id
        self.status = status
        self.created_at = created_at


# In-memory store for borrow requests (MVP - no separate table)
_borrow_requests: dict[str, BorrowRequest] = {}


def create_borrow_request(
    db: Session,
    book_id: int,
    borrower_name: str,
    borrower_email: str,
    borrower_phone: str,
    message: str = None
) -> dict:
    """
    Create a borrow request for a book.
    For MVP, stores in memory and updates book availability.
    """
    # Verify book exists
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        return None
    
    # Generate request ID
    import uuid
    request_id = f"br-{uuid.uuid4().hex[:8]}"
    
    # Store request
    request = BorrowRequest(
        request_id=request_id,
        book_id=book_id,
        status="pending",
        created_at=datetime.utcnow().isoformat() + "Z"
    )
    _borrow_requests[request_id] = request
    
    return {
        "requestId": request_id,
        "bookId": book_id,
        "status": "pending",
        "createdAt": request.created_at
    }


def get_borrow_request(request_id: str) -> Optional[BorrowRequest]:
    """Get a borrow request by ID."""
    return _borrow_requests.get(request_id)
