"""
Pydantic schemas for Notification API.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[str] = None
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    type: str = "BOOK_UPLOADED"
    title: str
    message: str
    book_id: Optional[int] = None
    book_slug: Optional[str] = None
    book_cover: Optional[str] = None
    created_at: Optional[datetime] = None
    is_read: bool = False

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    success: bool = True
    data: List[NotificationResponse]
    unread_count: int


class MarkReadResponse(BaseModel):
    success: bool = True
    message: str
    unread_count: int


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys
    user_agent: Optional[str] = None


class PushUnsubscribeRequest(BaseModel):
    endpoint: str


class VapidPublicKeyData(BaseModel):
    public_key: str


class VapidPublicKeyResponse(BaseModel):
    success: bool = True
    data: VapidPublicKeyData


class PushStatusResponse(BaseModel):
    success: bool = True
    is_subscribed: bool
