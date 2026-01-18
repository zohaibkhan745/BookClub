"""
User schemas for API request/response validation.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


# ============================================
# Request Schemas
# ============================================

class UserCreate(BaseModel):
    """Schema for user registration (signup)."""
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "johndoe",
                "full_name": "John Doe",
                "email": "john@example.com",
                "password": "securepassword123"
            }
        }


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "password": "securepassword123"
            }
        }


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)


# ============================================
# Response Schemas
# ============================================

class UserResponse(BaseModel):
    """Public user information."""
    id: str
    username: str
    full_name: str
    email: str
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """Minimal public user info (for listing displays)."""
    id: str
    username: str
    full_name: str
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Response after successful authentication."""
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
    
    class Config:
        json_schema_extra = {
            "example": {
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "username": "johndoe",
                    "full_name": "John Doe",
                    "email": "john@example.com",
                    "created_at": "2026-01-18T10:00:00Z"
                },
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }
