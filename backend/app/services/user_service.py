"""
User service for business logic related to users.

Handles:
- User registration (signup)
- User authentication (login) - Note: Primary auth via Supabase
- User lookup by various criteria
- Password hashing and verification
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_, exists, and_, func
from typing import Optional
from passlib.context import CryptContext
from app.models import User
from app.schemas import UserCreate
import uuid

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain text password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Fetch a user by their ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Fetch a user by their email address."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Fetch a user by their username."""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email_or_username(db: Session, identifier: str) -> Optional[User]:
    """Fetch a user by email or username."""
    return db.query(User).filter(
        or_(User.email == identifier, User.username == identifier)
    ).first()


def check_user_exists(db: Session, email: str, username: str) -> dict:
    """
    Check if a user with the given email or username already exists.
    Optimized: Single query with conditional aggregation instead of 2 queries.
    
    Returns:
        dict with 'email_exists' and 'username_exists' booleans
    """
    # Use single query with conditional count - more efficient than 2 separate queries
    result = db.query(
        func.count(func.nullif(User.email != email, True)).label('email_count'),
        func.count(func.nullif(User.username != username, True)).label('username_count')
    ).filter(
        or_(User.email == email, User.username == username)
    ).first()
    
    return {
        "email_exists": (result.email_count or 0) > 0,
        "username_exists": (result.username_count or 0) > 0
    }


def create_user(db: Session, user_data: UserCreate, supabase_id: Optional[str] = None) -> User:
    """
    Create a new user.
    
    Args:
        db: Database session
        user_data: User creation data
        supabase_id: Optional Supabase auth user ID to use as the user ID.
                     If not provided, generates a new UUID.
    
    Returns:
        Created User instance
    
    Raises:
        ValueError: If email or username already exists
    """
    # Check for existing users
    existing = check_user_exists(db, user_data.email, user_data.username)
    
    if existing["email_exists"]:
        raise ValueError("A user with this email already exists")
    
    if existing["username_exists"]:
        raise ValueError("A user with this username already exists")
    
    # Create the user
    db_user = User(
        id=supabase_id or str(uuid.uuid4()),
        username=user_data.username,
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user by email and password.
    
    Args:
        db: Database session
        email: User's email
        password: Plain text password
    
    Returns:
        User instance if authentication succeeds, None otherwise
    """
    user = get_user_by_email(db, email)
    
    if not user:
        return None
    
    if not user.password_hash:
        # User was created via Supabase, no local password
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user


def sync_supabase_user(db: Session, supabase_id: str, email: str, full_name: str) -> User:
    """
    Sync or create a user from Supabase authentication.
    
    Called after successful Supabase login to ensure user exists in local DB.
    
    Args:
        db: Database session
        supabase_id: Supabase auth user ID
        email: User's email from Supabase
        full_name: User's full name from Supabase metadata
    
    Returns:
        User instance (created or existing)
    """
    # Check if user already exists
    existing_user = get_user_by_id(db, supabase_id)
    
    if existing_user:
        # Update if email or name changed
        if existing_user.email != email:
            existing_user.email = email
        if existing_user.full_name != full_name:
            existing_user.full_name = full_name
        db.commit()
        db.refresh(existing_user)
        return existing_user
    
    # Check if email exists with different ID (edge case)
    email_user = get_user_by_email(db, email)
    if email_user:
        # Update the existing user's ID to match Supabase
        email_user.id = supabase_id
        email_user.full_name = full_name
        db.commit()
        db.refresh(email_user)
        return email_user
    
    # Create new user
    # Generate username from email (before @)
    # Optimized: Single query to find max counter instead of N queries in a loop
    base_username = email.split('@')[0].lower()
    
    # Find existing usernames with this base in one query
    existing = db.query(User.username).filter(
        User.username.like(f"{base_username}%")
    ).all()
    existing_usernames = {u.username for u in existing}
    
    # Find available username
    username = base_username
    counter = 1
    while username in existing_usernames:
        username = f"{base_username}{counter}"
        counter += 1
    
    new_user = User(
        id=supabase_id,
        username=username,
        full_name=full_name,
        email=email,
        password_hash=None,  # Auth via Supabase
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


def search_users_by_name(db: Session, name_query: str, limit: int = 10) -> list[User]:
    """
    Search for users by full name (partial match).
    
    Args:
        db: Database session
        name_query: Search query for full name
        limit: Maximum results to return
    
    Returns:
        List of matching users
    """
    return db.query(User).filter(
        User.full_name.ilike(f"%{name_query}%")
    ).limit(limit).all()
