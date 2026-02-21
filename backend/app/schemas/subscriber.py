"""
Pydantic schemas for the subscriber/newsletter feature.
"""
from pydantic import BaseModel, EmailStr, Field


class SubscribeRequest(BaseModel):
    """Request body for subscribing to notifications."""
    email: EmailStr = Field(..., description="Email address to subscribe")


class SubscribeResponse(BaseModel):
    """Response after subscribing."""
    message: str
    email: str
