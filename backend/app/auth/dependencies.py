"""
Authentication dependencies for FastAPI.
Verifies Supabase JWTs and extracts user information.

Security Notes:
- Authentication (sign-up/sign-in) is handled by Supabase on the client side
- Supabase enforces email uniqueness at the database level
- Supabase handles password hashing (bcrypt) internally
- This module only verifies Supabase-issued JWTs for protected endpoints
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from pydantic import BaseModel
from typing import Optional
from app.config import get_settings
import logging
import httpx

# Configure logging
logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)

# Cache for JWKS
_jwks_cache = None
_jwks_client = None


async def get_jwks():
    """Fetch JWKS (JSON Web Key Set) from Supabase for ES256 verification."""
    global _jwks_cache, _jwks_client
    
    if _jwks_cache is not None:
        return _jwks_cache
    
    settings = get_settings()
    # Use the correct Supabase JWKS endpoint path
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    
    try:
        headers = {}
        if settings.supabase_anon_key:
            headers["apikey"] = settings.supabase_anon_key
        
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, headers=headers)
            response.raise_for_status()
            _jwks_cache = response.json()
            logger.info(f"Fetched JWKS from {jwks_url}")
            return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch JWKS: {str(e)}")
        raise


# Standard error codes for consistent API responses
class AuthErrorCodes:
    """Authentication error codes for frontend handling."""
    NOT_AUTHENTICATED = "NOT_AUTHENTICATED"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    INVALID_SIGNATURE = "INVALID_SIGNATURE"
    MISSING_USER_ID = "MISSING_USER_ID"


class AuthUser(BaseModel):
    """Authenticated user information extracted from JWT."""
    id: str  # Supabase user ID (UUID)
    email: Optional[str] = None
    full_name: Optional[str] = None


async def verify_token(token: str) -> dict:
    """
    Verify a Supabase JWT token and return the payload.
    
    Args:
        token: The JWT token string
        
    Returns:
        The decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
        
    Security Notes:
        - Supports both ES256 (newer Supabase) and HS256 (legacy) algorithms
        - Validates 'authenticated' audience claim
        - Provides specific error codes for different failure scenarios
    """
    settings = get_settings()
    
    try:
        # First, get unverified header to check the algorithm
        unverified_header = jwt.get_unverified_header(token)
        algorithm = unverified_header.get('alg', 'HS256')
        kid = unverified_header.get('kid')
        
        logger.info(f"JWT algorithm: {algorithm}, kid: {kid}")
        
        if algorithm == 'ES256':
            # New Supabase projects use ES256 - verify with JWKS
            jwks = await get_jwks()
            
            # Find the correct key by kid
            key = None
            for k in jwks.get('keys', []):
                if k.get('kid') == kid:
                    key = k
                    break
            
            if not key:
                # If no kid match, try the first key
                key = jwks.get('keys', [{}])[0]
            
            payload = jwt.decode(
                token,
                key,
                algorithms=["ES256"],
                audience="authenticated"
            )
        else:
            # Legacy Supabase projects use HS256 with JWT secret
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated"
            )
        
        return payload
    except ExpiredSignatureError:
        logger.warning("JWT token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": AuthErrorCodes.TOKEN_EXPIRED, "message": "Token has expired. Please sign in again."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        logger.warning(f"JWT verification failed: {str(e)}")
        logger.warning(f"Token prefix: {token[:50]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": AuthErrorCodes.INVALID_TOKEN, "message": "Invalid authentication token"},
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
            detail={"code": AuthErrorCodes.NOT_AUTHENTICATED, "message": "Authentication required"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = await verify_token(credentials.credentials)
    
    # Extract user info from the JWT payload
    user_id = payload.get("sub")  # Supabase stores user ID in 'sub' claim
    email = payload.get("email")
    
    # Extract full_name from user_metadata (set during sign-up)
    user_metadata = payload.get("user_metadata", {})
    full_name = user_metadata.get("full_name")
    
    if not user_id:
        logger.error("JWT payload missing 'sub' claim")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": AuthErrorCodes.MISSING_USER_ID, "message": "Token missing user ID"},
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
        payload = await verify_token(credentials.credentials)
        user_id = payload.get("sub")
        email = payload.get("email")
        
        # Extract full_name from user_metadata
        user_metadata = payload.get("user_metadata", {})
        full_name = user_metadata.get("full_name")
        
        if not user_id:
            return None
            
        return AuthUser(id=user_id, email=email, full_name=full_name)
    except HTTPException:
        return None
