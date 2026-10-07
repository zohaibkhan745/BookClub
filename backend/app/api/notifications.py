"""
Notification API routes for book upload alerts and activity feed.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.auth.dependencies import get_current_user, get_optional_user, AuthUser
from app.config import get_settings
from app.models.notification import Notification
from app.services import notification_service, push_service
from app.schemas.notification import (
    NotificationListResponse,
    MarkReadResponse,
    PushSubscribeRequest,
    PushUnsubscribeRequest,
    VapidPublicKeyResponse,
    PushStatusResponse,
)

router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["notifications"],
)


@router.get("", response_model=NotificationListResponse)
def get_notifications(
    limit: int = Query(20, ge=1, le=50, description="Max notifications to retrieve"),
    unread_only: bool = Query(False, description="Filter for unread only"),
    db: Session = Depends(get_db),
    user: Optional[AuthUser] = Depends(get_optional_user)
):
    """
    Get notifications feed.
    - If authenticated, includes personal read status and unread count.
    - If unauthenticated (guest), returns public notifications with is_read=False and unread_count=0.
    """
    user_id = user.id if user else None
    items, unread_count = notification_service.get_notifications_for_user(
        db=db,
        user_id=user_id,
        limit=limit,
        unread_only=unread_only
    )
    return {
        "success": True,
        "data": items,
        "unread_count": unread_count
    }


@router.post("/{notification_id}/read", response_model=MarkReadResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    Mark a specific notification as read.
    Requires authentication.
    Returns 404 if notification does not exist.
    Returns 403 if attempting to access another user's targeted notification.
    """
    # 1. Verify notification existence
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Notification not found"}
        )

    # 2. Check authorization: broadcast (user_id IS NULL) is accessible to all;
    # targeted notifications are accessible only to the targeted user.
    if notification.user_id is not None and notification.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "You do not have permission to access this notification"}
        )

    unread_count = notification_service.mark_notification_as_read(
        db=db,
        user_id=user.id,
        notification_id=notification_id
    )
    return {
        "success": True,
        "message": "Notification marked as read",
        "unread_count": unread_count
    }



@router.post("/read-all", response_model=MarkReadResponse)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    user: AuthUser = Depends(get_current_user)
):
    """
    Mark all notifications as read for current user.
    Requires authentication.
    """
    unread_count = notification_service.mark_all_notifications_as_read(
        db=db,
        user_id=user.id
    )
    return {
        "success": True,
        "message": "All notifications marked as read",
        "unread_count": unread_count
    }


# ============================================================================
# Web Push Endpoints (iOS Home Screen PWA & Android)
# ============================================================================

@router.get("/push/public-key", response_model=VapidPublicKeyResponse)
def get_vapid_public_key():
    """
    Retrieve application server VAPID public key.
    Required by client browser/service worker to subscribe to Web Push.
    """
    settings = get_settings()
    return {
        "success": True,
        "data": {
            "public_key": settings.vapid_public_key
        }
    }


@router.post("/push/subscribe")
def subscribe_to_push(
    body: PushSubscribeRequest,
    db: Session = Depends(get_db),
    user: Optional[AuthUser] = Depends(get_optional_user)
):
    """
    Register device push subscription endpoint and crypto keys.
    Associates with user account if logged in.
    """
    user_id = user.id if user else None
    push_service.save_subscription(
        db=db,
        endpoint=body.endpoint,
        p256dh=body.keys.p256dh,
        auth=body.keys.auth,
        user_id=user_id,
        user_agent=body.user_agent
    )
    return {
        "success": True,
        "message": "Push notifications enabled successfully"
    }


@router.post("/push/unsubscribe")
def unsubscribe_from_push(
    body: PushUnsubscribeRequest,
    db: Session = Depends(get_db)
):
    """
    Unregister device push subscription.
    """
    removed = push_service.remove_subscription(db=db, endpoint=body.endpoint)
    return {
        "success": True,
        "message": "Push notifications disabled" if removed else "Subscription not found"
    }


@router.get("/push/status", response_model=PushStatusResponse)
def get_push_status(
    endpoint: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Optional[AuthUser] = Depends(get_optional_user)
):
    """
    Check if current device or user is subscribed to push notifications.
    """
    user_id = user.id if user else None
    is_sub = push_service.is_user_subscribed(db=db, user_id=user_id, endpoint=endpoint)
    return {
        "success": True,
        "is_subscribed": is_sub
    }


@router.post("/push/test")
def send_test_push_notification(
    endpoint: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: Optional[AuthUser] = Depends(get_optional_user)
):
    """
    Send an immediate test push notification to verify iOS/Android lockscreen alerts.
    """
    user_id = user.id if user else None
    sent_count = push_service.send_test_push(db=db, user_id=user_id, endpoint=endpoint)
    return {
        "success": True,
        "sent_count": sent_count,
        "message": f"Sent test push notification to {sent_count} device(s)." if sent_count > 0 else "No active device subscriptions found to test."
    }
