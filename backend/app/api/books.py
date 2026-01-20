from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.services import book_service
from app.schemas.book import (
    BookCreate,
    BookPreview,
    BookResponse,
    BookSectionsResponse,
    MarkBorrowedRequest,
)
from app.auth import get_current_user, AuthUser
from datetime import datetime
import os
import re
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["books"])

# Cache durations in seconds
CACHE_SHORT = 60      # 1 minute - for list endpoints
CACHE_MEDIUM = 300    # 5 minutes - for individual book details
CACHE_NONE = 0        # No cache - for mutations


@router.delete("/books/all")
async def delete_all_books(db: Session = Depends(get_db)):
    """
    DELETE /books/all - Delete all books from database.
    WARNING: This is a destructive operation for development use only.
    """
    try:
        db.execute(text("DELETE FROM books"))
        db.commit()
        return {
            "success": True,
            "message": "All books deleted successfully"
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
        # Public attribution using full name - email is never exposed
        "listedBy": book.listed_by or None,
        # Ownership info for conditional UI rendering (e.g., showing "Mark as borrowed" button)
        "uploadedByUserId": book.user_id,
        # Borrowing status
        "isBorrowed": book.is_borrowed or False,
        "borrowedByName": book.borrowed_by_name,
        "borrowedByUserId": book.borrowed_by_user_id,
    }


@router.get("/books")
async def get_books(response: Response, db: Session = Depends(get_db)):
    """
    GET /books - Fetch all books organized by homepage sections.
    """
    try:
        # Add cache headers - cache for 60 seconds
        response.headers["Cache-Control"] = f"public, max-age={CACHE_SHORT}, stale-while-revalidate=30"
        
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
async def get_books_by_genre(genre: str, response: Response, db: Session = Depends(get_db)):
    """
    GET /books/genre/{genre} - Fetch all books by genre/category.
    """
    try:
        # Add cache headers - cache for 60 seconds
        response.headers["Cache-Control"] = f"public, max-age={CACHE_SHORT}, stale-while-revalidate=30"
        
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
async def get_book(book_id: int, response: Response, db: Session = Depends(get_db)):
    """
    GET /books/{id} - Fetch a single book by ID.
    """
    book = book_service.get_book_by_id(db, book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BOOK_NOT_FOUND", "message": f"Book with ID {book_id} not found."}
        )
    
    # Add cache headers - cache for 5 minutes (individual book details change less frequently)
    response.headers["Cache-Control"] = f"public, max-age={CACHE_MEDIUM}, stale-while-revalidate=60"
    
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
    if book_data.listing_type.value == "sell" and not book_data.price:
        errors.append({"field": "price", "message": "Price is required for selling"})
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Validation failed", "details": errors}
        )
    
    try:
        # SECURITY: Ownership fields are derived from the authenticated user context,
        # NEVER from frontend input. This prevents users from spoofing attribution.
        # The full_name comes from Supabase user_metadata set during signup.
        # Email is deliberately NOT stored in book records to keep it private.
        book_data.user_id = user.id
        book_data.listed_by = user.full_name or "Anonymous"
        
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


@router.delete("/books/{book_id}")
async def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    DELETE /books/{book_id} - Delete a book listing.
    
    AUTHORIZATION RULES (enforced on backend - cannot be bypassed):
    1. User must be authenticated (JWT required)
    2. User must be the uploader/owner of the book (book.user_id === current_user.id)
    
    This endpoint also cleans up the cover image from Supabase Storage
    if the book has one stored there.
    
    Returns:
    - 200: Book deleted successfully
    - 401: Not authenticated
    - 403: Forbidden - user is not the book owner
    - 404: Book not found
    """
    # Step 1: Fetch the book from database
    book = book_service.get_book_by_id(db, book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BOOK_NOT_FOUND", "message": f"Book with ID {book_id} not found"}
        )
    
    # Step 2: AUTHORIZATION CHECK - Critical security enforcement
    # Only the book owner (uploader) can delete their own book
    # This check prevents unauthorized deletion via direct API calls
    if book.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "NOT_AUTHORIZED", "message": "You can only delete books you uploaded"}
        )
    
    # Step 3: Delete cover image from Supabase Storage (if exists)
    # Only attempt deletion if the cover_image is a Supabase Storage URL
    cover_image = book.cover_image
    if cover_image and "supabase.co/storage/v1/object" in cover_image:
        try:
            await delete_image_from_storage(cover_image)
        except Exception as e:
            # Log the error but don't fail the deletion
            # The book should still be deleted even if image cleanup fails
            logger.warning(f"Failed to delete image from storage for book {book_id}: {e}")
    
    # Step 4: Delete the book from database
    deleted = book_service.delete_book(db, book_id, user_id=user.id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DELETE_FAILED", "message": "Failed to delete book"}
        )
    
    return {
        "success": True,
        "message": f"Book '{book.title}' has been deleted successfully"
    }


async def delete_image_from_storage(image_url: str) -> bool:
    """
    Delete an image from Supabase Storage bucket.
    
    Args:
        image_url: Full public URL of the image in Supabase Storage
        
    Returns:
        True if deletion successful, False otherwise
        
    The URL format is: 
    https://{project}.supabase.co/storage/v1/object/public/book-images/{path}
    We need to extract the path and call the Storage API to delete.
    """
    # Extract the file path from the URL
    # URL: https://xxx.supabase.co/storage/v1/object/public/book-images/migrated/books/18.jpg
    # Path: migrated/books/18.jpg
    match = re.search(r'/storage/v1/object/public/book-images/(.+)$', image_url)
    if not match:
        logger.warning(f"Could not extract path from image URL: {image_url}")
        return False
    
    file_path = match.group(1)
    
    # Get Supabase credentials from environment
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        logger.warning("Supabase credentials not configured for storage deletion")
        return False
    
    # Call Supabase Storage API to delete the file
    delete_url = f"{supabase_url}/storage/v1/object/book-images/{file_path}"
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            delete_url,
            headers={
                "Authorization": f"Bearer {supabase_key}",
                "apikey": supabase_key,
            }
        )
        
        if response.status_code in [200, 204]:
            logger.info(f"Successfully deleted image from storage: {file_path}")
            return True
        else:
            logger.warning(f"Failed to delete image {file_path}: {response.status_code} - {response.text}")
            return False


@router.get("/user/library")
async def get_user_library(
    response: Response,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    GET /user/library - Fetch the current user's library.
    Returns books uploaded by the user and books borrowed by the user.
    Requires authentication.
    """
    try:
        # Private cache - user-specific data
        response.headers["Cache-Control"] = f"private, max-age={CACHE_SHORT}"
        
        # Get books uploaded by this user
        uploaded_books = book_service.get_books_by_user(db, user.id)
        
        # Get books borrowed by this user (using borrowed_by_user_id field)
        borrowed_books = book_service.get_books_borrowed_by_user(db, user.id)
        
        return {
            "success": True,
            "data": {
                "uploaded": [book_to_response(b) for b in uploaded_books],
                "borrowed": [book_to_response(b) for b in borrowed_books],
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "FETCH_FAILED", "message": str(e)}
        )


@router.post("/books/{book_id}/mark-borrowed")
async def mark_book_as_borrowed(
    book_id: int,
    request: MarkBorrowedRequest,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    POST /books/{id}/mark-borrowed - Mark a book as borrowed.
    
    Authorization Rules (enforced on backend):
    - User must be authenticated
    - User must be the uploader of the book (book.user_id === currentUser.id)
    - Book must not already be borrowed (is_borrowed === false)
    - Borrower name must match a registered user
    
    This endpoint cannot be bypassed via direct API calls.
    """
    # Validate borrower name is not empty
    borrower_name = request.borrower_full_name.strip()
    if not borrower_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Borrower name is required"}
        )
    
    # Fetch the book
    book = book_service.get_book_by_id(db, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BOOK_NOT_FOUND", "message": f"Book with ID {book_id} not found"}
        )
    
    # AUTHORIZATION: Verify current user is the uploader
    # This is the critical security check - only the book owner can mark it as borrowed
    if book.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "NOT_AUTHORIZED", "message": "Only the book uploader can mark it as borrowed"}
        )
    
    # Check if book is already borrowed
    if book.is_borrowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "ALREADY_BORROWED", "message": "This book is already borrowed"}
        )
    
    # Search for the borrower in the users database
    # Since we use Supabase for auth, we need to search by full_name in existing books
    # or use Supabase admin API. For now, search users who have uploaded books.
    borrower = book_service.find_user_by_full_name(db, borrower_name)
    
    if not borrower:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "BORROWER_NOT_FOUND", 
                "message": "This person is not registered. The borrower must have an account."
            }
        )
    
    # Mark the book as borrowed
    updated_book = book_service.mark_book_as_borrowed(
        db=db,
        book_id=book_id,
        borrowed_by_user_id=borrower["user_id"],
        borrowed_by_name=borrower["full_name"]
    )
    
    return {
        "success": True,
        "data": book_to_response(updated_book)
    }