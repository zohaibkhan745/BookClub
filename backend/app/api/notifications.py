"""
Notification API routes for book upload alerts and activity feed.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.auth.dependencies import get_current_user, get_optional_user, AuthUser
from app.models.notification import Notification
from app.services import notification_service
from app.schemas.notification import NotificationListResponse, MarkReadResponse

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
