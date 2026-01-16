from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import book_service
from app.schemas.book import (
    BookCreate,
    BookPreview,
    BookResponse,
    BookSectionsResponse,
)
from app.auth import get_current_user, AuthUser
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["books"])


def book_to_preview(book) -> dict:
    """Convert Book model to preview format."""
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "image": book.cover_image or "",
    }


def book_to_response(book) -> dict:
    """Convert Book model to full response format."""
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "genre": book.category,
        "image": book.cover_image or "",
        "description": book.description or "",
        "year": book.created_at.strftime("%Y") if book.created_at else str(datetime.now().year),
        "pages": 0,
        "language": "English",
        "rating": 5,
        "whatsappNumber": book.whatsapp_number or "",
        "listingType": book.listing_type or "lend",
        "price": book.price or "",
    }


@router.get("/books")
async def get_books(db: Session = Depends(get_db)):
    """
    GET /books - Fetch all books organized by homepage sections.
    """
    try:
        sections = book_service.get_books_by_section(db)
        return {
            "success": True,
            "data": {
                "trending": [book_to_preview(b) for b in sections["trending"]],
                "newArrivals": [book_to_preview(b) for b in sections["newArrivals"]],
                "popular": [book_to_preview(b) for b in sections["popular"]],
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "FETCH_FAILED", "message": str(e)}
        )


@router.get("/books/genre/{genre}")
async def get_books_by_genre(genre: str, db: Session = Depends(get_db)):
    """
    GET /books/genre/{genre} - Fetch all books by genre/category.
    """
    try:
        books = book_service.get_books_by_genre(db, genre)
        return {
            "success": True,
            "data": [book_to_preview(b) for b in books]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "FETCH_FAILED", "message": str(e)}
        )


@router.get("/books/{book_id}")
async def get_book(book_id: int, db: Session = Depends(get_db)):
    """
    GET /books/{id} - Fetch a single book by ID.
    """
    book = book_service.get_book_by_id(db, book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BOOK_NOT_FOUND", "message": f"Book with ID {book_id} not found."}
        )
    
    return {
        "success": True,
        "data": book_to_response(book)
    }


@router.post("/books", status_code=status.HTTP_201_CREATED)
async def create_book(
    book_data: BookCreate,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    POST /books - Create a new book listing.
    Requires authentication.
    """
    # Validation
    errors = []
    
    if not book_data.title or not book_data.title.strip():
        errors.append({"field": "title", "message": "Title is required"})
    if not book_data.author or not book_data.author.strip():
        errors.append({"field": "author", "message": "Author is required"})
    if not book_data.category or not book_data.category.strip():
        errors.append({"field": "category", "message": "Category is required"})
    if book_data.listing_type.value == "sell" and not book_data.price:
        errors.append({"field": "price", "message": "Price is required for selling"})
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Validation failed", "details": errors}
        )
    
    try:
        book = book_service.create_book(db, book_data)
        return {
            "success": True,
            "data": book_to_response(book)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )
