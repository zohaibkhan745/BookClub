"""
Books API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
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
    """
    Convert Book model to preview format for listing pages.
    
    Uses thumbnail URL if available, falls back to full image.
    This keeps listing pages fast by loading ~10-20KB thumbnails.
    """
    # Prefer thumbnail for listings, fallback to full image
    image_url = book.cover_image_thumb_url or book.cover_image or ""
    
    return {
        "id": str(book.id),
        "title": book.title,
        "author": book.author,
        "image": image_url,
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
async def get_all_books_endpoint(
    cursor: int = Query(default=0, ge=0, description="Cursor for pagination (book ID to start after)"),
    limit: int = Query(default=20, ge=1, le=50, description="Number of books to return (max 50)"),
    db: Session = Depends(get_db)
):
    """
    GET /books/all - Fetch all books with cursor-based pagination.
    
    Query Parameters:
    - cursor: ID of the last book from previous page (0 for first page)
    - limit: Number of books to return (1-50, default 20)
    
    Response includes next_cursor for fetching the next page.
    Cursor-based pagination provides consistent performance as catalog grows.
    """
    try:
        books = book_service.get_all_books_paginated(db, cursor=cursor, limit=limit)
        
        # Determine if there are more results
        has_next = len(books) > limit
        result_books = books[:limit] if has_next else books
        next_cursor = result_books[-1].id if has_next and result_books else None
        
        return {
            "success": True,
            "data": [book_to_preview(b) for b in result_books],
            "pagination": {
                "next_cursor": next_cursor,
                "has_next": has_next,
                "limit": limit,
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
        
        # Award credit for uploading a book
        db_user.credits += 1
        db.commit()
        db.refresh(db_user)
        
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
    DELETE /books/{id} - Delete a book listing with credit clawback.
    
    Anti-Cheat Credit System:
    - User loses 1 credit when deleting a book (clawback)
    
    Validation Rules (must pass before deletion):
    1. Book exists and user is the owner
    2. Book is not currently borrowed (status = BORROWED)
    3. Collateral bankruptcy check: User must have enough credits after deletion
       to cover their active loans (books they are currently borrowing)
    """
    try:
        # Get the book first
        book = book_service.get_book_by_id(db, book_id)
        
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "BOOK_NOT_FOUND", "message": "Book not found"}
            )
        
        # Verify ownership
        if book.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "NOT_AUTHORIZED", "message": "Only the book owner can delete this book"}
            )
        
        # =====================================================
        # CHECK 1: Is the book currently in use (borrowed)?
        # =====================================================
        # A book cannot be deleted if someone is currently borrowing it.
        # This prevents deleting a book that is physically with someone else.
        if borrow_service.is_book_borrowed(db, book_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "BOOK_IN_USE",
                    "message": "Cannot delete this book. It is currently borrowed by someone. "
                               "Wait for them to return it first."
                }
            )
        
        # =====================================================
        # CHECK 2: Collateral Bankruptcy Check
        # =====================================================
        # The user's credit acts as "collateral" for books they borrow.
        # Deleting a book removes 1 credit. We must ensure the user
        # still has enough credits to cover their active loans.
        #
        # MATH:
        # - Current Credits: Total credits the user has
        # - Future Balance = Current Credits - 1 (after clawback)
        # - Active Loans: Number of books user is currently borrowing
        #
        # Rule: Future Balance >= Active Loans
        # If Future Balance < Active Loans => BLOCK deletion
        #
        # Example:
        # - User has 2 credits, borrowing 2 books
        # - If they delete a book: Future Balance = 2 - 1 = 1
        # - 1 < 2 (active loans) => BLOCKED
        # - They must return 1 book first before deleting their own book.
        
        db_user = user_service.get_user_by_id(db, user.id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "USER_NOT_FOUND", "message": "User not found"}
            )
        
        current_credits = db_user.credits or 1  # Default to 1 if None
        future_balance = current_credits - 1
        active_loans = borrow_service.get_active_borrow_count_for_user(db, user.id)
        
        if future_balance < active_loans:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "COLLATERAL_BANKRUPTCY",
                    "message": f"Cannot delete this book. You have {active_loans} borrowed book(s) "
                               f"but would only have {future_balance} credit(s) left. "
                               f"Return a borrowed book first, then you can delete this one."
                }
            )
        
        # =====================================================
        # Deletion and Credit Clawback
        # =====================================================
        # All checks passed - proceed with deletion
        
        # Store book info for logging
        book_id_int = book.id
        book_title = book.title
        
        # Delete the book
        db.delete(book)
        
        # Clawback 1 credit from the user
        db_user.credits = max(0, current_credits - 1)  # Don't go below 0
        
        # Commit both operations atomically
        db.commit()
        
        # Invalidate caches
        from app.services.book_service import invalidate_books_cache, invalidate_user_cache
        from app.cache import cache
        invalidate_books_cache()
        cache.delete(f"books:id:{book_id_int}")
        invalidate_user_cache(user.id)
        
        return {
            "success": True,
            "message": "Book deleted",
            "creditsDeducted": 1,
            "newCreditBalance": db_user.credits
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "NOT_AUTHORIZED", "message": str(e)}
        )
    except Exception as e:
        db.rollback()
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
    Includes pending request counts for uploaded books.
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
        
        # Get pending request counts for uploaded books
        uploaded_book_ids = [b.id for b in uploaded_books]
        pending_counts = borrow_service.get_pending_request_counts_for_books(db, uploaded_book_ids)
        
        # Get books borrowed by this user
        borrowed_books = borrow_service.get_books_borrowed_by_user(db, user.id)
        
        # Build response with pending counts
        uploaded_response = []
        for book in uploaded_books:
            book_data = book_to_response(book, db)
            book_data["pendingRequestCount"] = pending_counts.get(book.id, 0)
            uploaded_response.append(book_data)
        
        return {
            "success": True,
            "data": {
                "uploaded": uploaded_response,
                "borrowed": [book_to_response(b, db) for b in borrowed_books],
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "FETCH_FAILED", "message": str(e)}
        )
