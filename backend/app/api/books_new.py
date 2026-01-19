"""
Books API endpoints.

Refactored to:
- Use new Book model with owner_id/owner_full_name
- Derive borrow status from borrow_records table
- Use is_active instead of is_available
- Support both legacy and new response formats for backwards compatibility
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from app.db.database import get_db
from app.services import book_service, borrow_service, user_service
from app.schemas import BookCreate, BookUpdate
from app.auth import get_current_user, get_optional_user, AuthUser

router = APIRouter(prefix="/api/v1", tags=["books"])


@router.delete("/books/all")
async def delete_all_books(db: Session = Depends(get_db)):
    """
    DELETE /books/all - Delete all books from database.
    WARNING: This is a destructive operation for development use only.
    """
    try:
        # Count before
        result = db.execute(text("SELECT COUNT(*) FROM books"))
        count_before = result.fetchone()[0]
        
        # Delete
        db.execute(text("DELETE FROM books"))
        db.commit()
        
        return {
            "success": True,
            "message": f"Deleted {count_before} books successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DELETE_FAILED", "message": str(e)}
        )


def book_to_preview(book) -> dict:
    """Convert Book model to preview format."""
    return {
        "id": str(book.id),
        "title": book.title,
        "author": book.author,
        "image": book.cover_image or "",
    }


def book_to_response(book, db: Session) -> dict:
    """
    Convert Book model to full response format.
    
    Borrow status is computed from borrow_records table.
    """
    # Get borrow status from borrow_records
    borrow_status = borrow_service.get_borrow_status(db, str(book.id))
    
    return {
        "id": str(book.id),
        "title": book.title,
        "author": book.author,
        "genre": book.category,
        "image": book.cover_image or "",
        "description": book.description or "",
        "year": book.created_at.strftime("%Y") if book.created_at else str(datetime.now().year),
        "pages": 0,
        "language": "English",
        "rating": 5,
        "listingType": book.listing_type or "lend",
        "condition": book.condition or "good",
        "price": book.price or "",
        "whatsappNumber": book.whatsapp_number or "",
        
        # Owner info (new naming)
        "ownerId": book.owner_id,
        "ownerFullName": book.owner_full_name,
        
        # Legacy compatibility
        "listedBy": book.owner_full_name,
        "uploadedByUserId": book.owner_id,
        
        # Borrow status (computed from borrow_records)
        "borrowStatus": {
            "isBorrowed": borrow_status["is_borrowed"],
            "borrowerName": borrow_status["borrower_name"],
            "borrowerId": borrow_status["borrower_id"],
            "dueAt": borrow_status["due_at"].isoformat() if borrow_status["due_at"] else None,
        },
        
        # Legacy fields for backwards compatibility
        "isBorrowed": borrow_status["is_borrowed"],
        "borrowedByName": borrow_status["borrower_name"],
        "borrowedByUserId": borrow_status["borrower_id"],
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


@router.get("/books/all")
async def get_all_books_endpoint(db: Session = Depends(get_db)):
    """
    GET /books/all - Fetch all books from the database.
    """
    try:
        books = book_service.get_all_books(db, limit=100)
        return {
            "success": True,
            "data": [book_to_preview(b) for b in books]
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


@router.get("/books/search")
async def search_books(
    q: str = "",
    category: str = None,
    db: Session = Depends(get_db)
):
    """
    GET /books/search?q=query&category=Fiction - Search books.
    """
    try:
        books = book_service.search_books(db, q, category)
        return {
            "success": True,
            "data": [book_to_preview(b) for b in books]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SEARCH_FAILED", "message": str(e)}
        )


@router.get("/books/{book_id}")
async def get_book(book_id: str, db: Session = Depends(get_db)):
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
        "data": book_to_response(book, db)
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
    Associates the book with the authenticated user.
    """
    # Validation
    errors = []
    
    if not book_data.title or not book_data.title.strip():
        errors.append({"field": "title", "message": "Title is required"})
    if not book_data.author or not book_data.author.strip():
        errors.append({"field": "author", "message": "Author is required"})
    if not book_data.category or not book_data.category.strip():
        errors.append({"field": "category", "message": "Category is required"})
    if book_data.listing_type and book_data.listing_type.value == "sell" and not book_data.price:
        errors.append({"field": "price", "message": "Price is required for selling"})
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Validation failed", "details": errors}
        )
    
    try:
        # Ensure user exists in local DB
        db_user = user_service.get_user_by_id(db, user.id)
        if not db_user:
            db_user = user_service.sync_supabase_user(
                db,
                supabase_id=user.id,
                email=user.email or "",
                full_name=user.full_name or "Anonymous"
            )
        
        # Create book with ownership from authenticated user
        book = book_service.create_book(
            db,
            book_data,
            owner_id=user.id,
            owner_full_name=user.full_name or "Anonymous"
        )
        
        return {
            "success": True,
            "data": book_to_response(book, db)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@router.put("/books/{book_id}")
async def update_book(
    book_id: str,
    book_data: BookUpdate,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    PUT /books/{id} - Update a book listing.
    Only the book owner can update.
    """
    try:
        book = book_service.update_book(db, book_id, book_data, user.id)
        
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "BOOK_NOT_FOUND", "message": "Book not found"}
            )
        
        return {
            "success": True,
            "data": book_to_response(book, db)
        }
    
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "NOT_AUTHORIZED", "message": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@router.delete("/books/{book_id}")
async def delete_book(
    book_id: str,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    DELETE /books/{id} - Soft delete a book listing.
    Only the book owner can delete.
    """
    try:
        success = book_service.soft_delete_book(db, book_id, user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "BOOK_NOT_FOUND", "message": "Book not found"}
            )
        
        return {"success": True, "message": "Book deleted"}
    
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "NOT_AUTHORIZED", "message": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@router.get("/user/library")
async def get_user_library(
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    GET /user/library - Fetch the current user's library.
    Returns books uploaded by the user and books borrowed by the user.
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
        
        # Get books uploaded by this user
        uploaded_books = book_service.get_books_by_owner(db, user.id)
        
        # Get books borrowed by this user
        borrowed_books = borrow_service.get_books_borrowed_by_user(db, user.id)
        
        return {
            "success": True,
            "data": {
                "uploaded": [book_to_response(b, db) for b in uploaded_books],
                "borrowed": [book_to_response(b, db) for b in borrowed_books],
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "FETCH_FAILED", "message": str(e)}
        )
