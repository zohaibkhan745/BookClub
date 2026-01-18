"""
User API endpoints for authentication and user management.

Authentication Strategy:
- Primary auth is via Supabase (client-side)
- This API provides local user management and token verification
- On first Supabase login, user is synced to local database
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional

from app.db.database import get_db
from app.services import user_service
from app.schemas import (
    UserCreate,
    UserLogin,
    UserUpdate,
    UserResponse,
    AuthResponse,
)
from app.models import User, Book, BorrowRecord
from app.auth import get_current_user, AuthUser
from app.config import get_settings

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.delete("/all")
async def delete_all_users(db: Session = Depends(get_db)):
    """
    DELETE /users/all - Delete all users from local database.
    WARNING: Development only. Does NOT delete Supabase auth users.
    """
    try:
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        count = result.fetchone()[0]
        db.execute(text("DELETE FROM users"))
        db.commit()
        return {"success": True, "message": f"Deleted {count} local users"}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}


# ============================================
# Profile Endpoints
# ============================================

@router.get("/me", response_model=dict)
async def get_current_user_profile(
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    GET /users/me - Get current authenticated user's profile.
    
    Returns user info including id, full_name, email, and created_at.
    """
    db_user = user_service.get_user_by_id(db, user.id)
    
    if not db_user:
        # User exists in Supabase but not synced yet - sync them
        db_user = user_service.sync_supabase_user(
            db,
            supabase_id=user.id,
            email=user.email or "",
            full_name=user.full_name or "User"
        )
    
    return {
        "success": True,
        "data": {
            "id": db_user.id,
            "username": db_user.username,
            "full_name": db_user.full_name,
            "email": db_user.email,
            "created_at": db_user.created_at.isoformat() if db_user.created_at else None
        }
    }


@router.get("/me/stats", response_model=dict)
async def get_current_user_stats(
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    GET /users/me/stats - Get current user's activity statistics.
    
    Returns aggregate counts:
    - books_listed: Total books uploaded by the user
    - books_sold: Books marked as sold (listing_type='sell' and is_available=false)
    - books_borrowed: Books the user has borrowed from others
    
    Uses efficient COUNT queries for performance.
    """
    # Count books listed (uploaded) by this user
    books_listed = db.query(func.count(Book.id)).filter(
        Book.user_id == user.id
    ).scalar() or 0
    
    # Count books sold (sell listing that's no longer available)
    # A book is "sold" when listing_type='sell' and is_available=False
    books_sold = db.query(func.count(Book.id)).filter(
        Book.user_id == user.id,
        Book.listing_type == 'sell',
        Book.is_available == False
    ).scalar() or 0
    
    # Count books borrowed by this user (active borrow records)
    books_borrowed = db.query(func.count(BorrowRecord.id)).filter(
        BorrowRecord.borrower_id == user.id
    ).scalar() or 0
    
    return {
        "success": True,
        "data": {
            "books_listed": books_listed,
            "books_sold": books_sold,
            "books_borrowed": books_borrowed
        }
    }


@router.patch("/me", response_model=dict)
async def update_current_user_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    PATCH /users/me - Update current user's profile.
    
    Only allows updating full_name. Email changes require re-authentication
    through Supabase.
    """
    db_user = user_service.get_user_by_id(db, user.id)
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    
    # Only update full_name (email is managed by Supabase)
    if update_data.full_name:
        db_user.full_name = update_data.full_name
        db.commit()
        db.refresh(db_user)
    
    return {
        "success": True,
        "data": {
            "id": db_user.id,
            "username": db_user.username,
            "full_name": db_user.full_name,
            "email": db_user.email,
            "created_at": db_user.created_at.isoformat() if db_user.created_at else None
        }
    }


def create_access_token(user_id: str, email: str) -> str:
    """
    Create a JWT access token for local auth.
    
    Note: For Supabase auth, the token comes from Supabase.
    This is only used for local signup/login.
    """
    settings = get_settings()
    
    expire = datetime.utcnow() + timedelta(hours=24)
    
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    
    # Use Supabase JWT secret for consistency
    token = jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
    
    return token


@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    POST /users/signup - Register a new user.
    
    Creates a user in the local database. For production, consider:
    - Also creating the user in Supabase
    - Using Supabase webhooks to sync users
    """
    try:
        user = user_service.create_user(db, user_data)
        
        # Generate token for automatic login
        token = create_access_token(user.id, user.email)
        
        return {
            "success": True,
            "data": {
                "user": UserResponse.model_validate(user).model_dump(),
                "access_token": token,
                "token_type": "bearer"
            }
        }
    
    except ValueError as e:
        # Duplicate email or username
        error_msg = str(e)
        if "email" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "EMAIL_EXISTS", "message": error_msg}
            )
        elif "username" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "USERNAME_EXISTS", "message": error_msg}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "VALIDATION_ERROR", "message": error_msg}
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SERVER_ERROR", "message": str(e)}
        )


@router.post("/login", response_model=dict)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    POST /users/login - Authenticate a user.
    
    Note: For Supabase auth, use Supabase client directly.
    This endpoint is for local auth only.
    """
    user = user_service.authenticate_user(db, credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"}
        )
    
    token = create_access_token(user.id, user.email)
    
    return {
        "success": True,
        "data": {
            "user": UserResponse.model_validate(user).model_dump(),
            "access_token": token,
            "token_type": "bearer"
        }
    }


@router.get("/me", response_model=dict)
async def get_current_user_profile(
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    GET /users/me - Get the current authenticated user's profile.
    
    This works with both Supabase and local auth.
    If the user doesn't exist in local DB, sync from Supabase data.
    """
    # Try to get user from local DB
    db_user = user_service.get_user_by_id(db, user.id)
    
    if not db_user:
        # User exists in Supabase but not local DB - sync
        db_user = user_service.sync_supabase_user(
            db,
            supabase_id=user.id,
            email=user.email or "",
            full_name=user.full_name or "User"
        )
    
    return {
        "success": True,
        "data": UserResponse.model_validate(db_user).model_dump()
    }


@router.put("/me", response_model=dict)
async def update_current_user_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    PUT /users/me - Update the current user's profile.
    """
    db_user = user_service.get_user_by_id(db, user.id)
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found"}
        )
    
    # Check username uniqueness if being changed
    if update_data.username and update_data.username != db_user.username:
        existing = user_service.get_user_by_username(db, update_data.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "USERNAME_EXISTS", "message": "Username already taken"}
            )
    
    # Update fields
    if update_data.username:
        db_user.username = update_data.username
    if update_data.full_name:
        db_user.full_name = update_data.full_name
    
    db.commit()
    db.refresh(db_user)
    
    return {
        "success": True,
        "data": UserResponse.model_validate(db_user).model_dump()
    }


@router.get("/search", response_model=dict)
async def search_users(
    q: str,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    GET /users/search?q=name - Search users by name.
    
    Used for finding users when marking a book as borrowed.
    """
    if not q or len(q) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "QUERY_TOO_SHORT", "message": "Search query must be at least 2 characters"}
        )
    
    users = user_service.search_users_by_name(db, q, limit=10)
    
    return {
        "success": True,
        "data": [
            {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name
            }
            for u in users
        ]
    }


@router.post("/sync", response_model=dict)
async def sync_supabase_user(
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    POST /users/sync - Sync Supabase user to local database.
    
    Call this after Supabase login to ensure user exists in local DB.
    This enables relationships with books and borrow records.
    """
    db_user = user_service.sync_supabase_user(
        db,
        supabase_id=user.id,
        email=user.email or "",
        full_name=user.full_name or "User"
    )
    
    return {
        "success": True,
        "data": UserResponse.model_validate(db_user).model_dump()
    }
