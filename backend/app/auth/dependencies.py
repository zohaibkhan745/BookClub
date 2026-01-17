"""
Authentication dependencies for FastAPI.
Verifies Supabase JWTs and extracts user information.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from typing import Optional
from app.config import get_settings

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    """Authenticated user information extracted from JWT."""
    id: str  # Supabase user ID (UUID)
    email: Optional[str] = None
    full_name: Optional[str] = None


def verify_token(token: str) -> dict:
    """
    Verify a Supabase JWT token and return the payload.
    
    Args:
        token: The JWT token string
        
    Returns:
        The decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    settings = get_settings()
    
    try:
        # Decode and verify the JWT using Supabase's JWT secret
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Invalid or expired token"},
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AuthUser:
    """
    Dependency to get the current authenticated user.
    Use this for protected endpoints that REQUIRE authentication.
    
    Usage:
        @router.post("/books")
        async def create_book(user: AuthUser = Depends(get_current_user)):
            ...
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NOT_AUTHENTICATED", "message": "Authentication required"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = verify_token(credentials.credentials)
    
    # Extract user info from the JWT payload
    user_id = payload.get("sub")  # Supabase stores user ID in 'sub' claim
    email = payload.get("email")
    
    # Get full_name from user_metadata (set during signup)
    user_metadata = payload.get("user_metadata", {})
    full_name = user_metadata.get("full_name")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": "Token missing user ID"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return AuthUser(id=user_id, email=email, full_name=full_name)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[AuthUser]:
    """
    Dependency to optionally get the current user.
    Use this for endpoints where auth is optional but enhances functionality.
    
    Returns None if no valid token is provided.
    
    Usage:
        @router.get("/books")
        async def get_books(user: Optional[AuthUser] = Depends(get_optional_user)):
            if user:
                # Show personalized content
            ...
    """
    if not credentials:
        return None
    
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        email = payload.get("email")
        
        # Get full_name from user_metadata
        user_metadata = payload.get("user_metadata", {})
        full_name = user_metadata.get("full_name")
        
        if not user_id:
            return None
            
        return AuthUser(id=user_id, email=email, full_name=full_name)
    except HTTPException:
        return None
