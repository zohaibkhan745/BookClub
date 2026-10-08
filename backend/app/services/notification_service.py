"""
Notification service for managing in-app book upload and activity notifications.
"""
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_, not_
from app.models.notification import Notification, UserNotificationRead
from app.models.book import Book
import logging

logger = logging.getLogger(__name__)


def create_book_upload_notification(
    db: Session,
    book: Book,
    actor_id: Optional[str] = None,
    actor_name: Optional[str] = None
) -> Notification:
    """
    Create a broadcast notification when a new book is uploaded.
    Automatically marks as read for the actor (uploader) so they don't get alerted for their own upload.
    """
    display_name = actor_name or "A member"
    notification = Notification(
        user_id=None,  # Broadcast to all members
        actor_id=actor_id,
        actor_name=display_name,
        type="BOOK_UPLOADED",
        title="New Book Uploaded",
        message=f"{display_name} uploaded '{book.title}' by {book.author}.",
        book_id=book.id,
        book_slug=book.slug,
        book_cover=book.cover_image_thumb_url or book.cover_image,
    )
    db.add(notification)
    db.flush()  # Populates notification.id

    # Automatically mark as read for the person who uploaded it
    if actor_id:
        auto_read = UserNotificationRead(
            user_id=actor_id,
            notification_id=notification.id
        )
        db.add(auto_read)

    return notification


def create_borrow_request_notification(
    db: Session,
    book: Book,
    borrower_id: str,
    borrower_name: str,
    owner_id: str
) -> Notification:
    """
    Create a targeted notification for the book owner when someone requests to borrow their book.
    """
    display_name = borrower_name or "A member"
    notification = Notification(
        user_id=owner_id,  # Targeted to the book owner
        actor_id=borrower_id,
        actor_name=display_name,
        type="BORROW_REQUEST",
        title="New Borrow Request",
        message=f"{display_name} requested to borrow '{book.title}'.",
        book_id=book.id,
        book_slug=book.slug,
        book_cover=book.cover_image_thumb_url or book.cover_image,
    )
    db.add(notification)
    db.flush()
    return notification


def create_borrow_approved_notification(
    db: Session,
    book: Book,
    borrower_id: str,
    owner_id: str,
    owner_name: str
) -> Notification:
    """
    Create a targeted notification for the borrower when their borrow request is approved.
    """
    display_name = owner_name or "The owner"
    notification = Notification(
        user_id=borrower_id,  # Targeted to the borrower
        actor_id=owner_id,
        actor_name=display_name,
        type="BORROW_APPROVED",
        title="Borrow Request Approved",
        message=f"{display_name} approved your request to borrow '{book.title}'!",
        book_id=book.id,
        book_slug=book.slug,
        book_cover=book.cover_image_thumb_url or book.cover_image,
    )
    db.add(notification)
    db.flush()
    return notification


def get_notifications_for_user(
    db: Session,
    user_id: Optional[str] = None,
    limit: int = 20,
    unread_only: bool = False
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Get notifications with read state for a specific user (or guest).
    Returns (notifications_list, unread_count).
    """
    limit = max(1, min(limit, 50))  # Clamp between 1 and 50

    if not user_id:
        # Guest user - return broadcast notifications with is_read=False and unread_count=0
        query = (
            db.query(Notification)
            .filter(Notification.user_id.is_(None))
            .order_by(desc(Notification.created_at))
        )
        notifications = query.limit(limit).all()

        results = []
        for n in notifications:
            results.append({
                "id": n.id,
                "user_id": n.user_id,
                "actor_id": n.actor_id,
                "actor_name": n.actor_name,
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "book_id": n.book_id,
                "book_slug": n.book_slug,
                "book_cover": n.book_cover,
                "created_at": n.created_at,
                "is_read": False,
            })
        return results, 0


    # Authenticated user
    base_filter = or_(
        Notification.user_id.is_(None),
        Notification.user_id == user_id
    )

    query = (
        db.query(
            Notification,
            UserNotificationRead.id.label("read_id")
        )
        .outerjoin(
            UserNotificationRead,
            and_(
                UserNotificationRead.notification_id == Notification.id,
                UserNotificationRead.user_id == user_id
            )
        )
        .filter(base_filter)
    )

    if unread_only:
        query = query.filter(UserNotificationRead.id.is_(None))

    rows = query.order_by(desc(Notification.created_at)).limit(limit).all()

    results = []
    for notification, read_id in rows:
        results.append({
            "id": notification.id,
            "user_id": notification.user_id,
            "actor_id": notification.actor_id,
            "actor_name": notification.actor_name,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "book_id": notification.book_id,
            "book_slug": notification.book_slug,
            "book_cover": notification.book_cover,
            "created_at": notification.created_at,
            "is_read": read_id is not None,
        })

    # Calculate unread count (excluding the user's own actions)
    unread_count = (
        db.query(Notification.id)
        .outerjoin(
            UserNotificationRead,
            and_(
                UserNotificationRead.notification_id == Notification.id,
                UserNotificationRead.user_id == user_id
            )
        )
        .filter(base_filter)
        .filter(UserNotificationRead.id.is_(None))
        .filter(or_(Notification.actor_id.is_(None), Notification.actor_id != user_id))
        .count()
    )

    return results, unread_count


def mark_notification_as_read(
    db: Session,
    user_id: str,
    notification_id: int
) -> int:
    """
    Mark a single notification as read for the user.
    Returns the updated unread count.
    """
    existing = (
        db.query(UserNotificationRead)
        .filter(
            UserNotificationRead.user_id == user_id,
            UserNotificationRead.notification_id == notification_id
        )
        .first()
    )

    if not existing:
        new_read = UserNotificationRead(
            user_id=user_id,
            notification_id=notification_id
        )
        db.add(new_read)
        db.commit()

    _, unread_count = get_notifications_for_user(db, user_id=user_id, limit=1)
    return unread_count


def mark_all_notifications_as_read(
    db: Session,
    user_id: str
) -> int:
    """
    Mark all unread notifications visible to the user as read.
    Returns 0 (the new unread count).
    """
    base_filter = or_(
        Notification.user_id.is_(None),
        Notification.user_id == user_id
    )

    # Find IDs of unread notifications
    unread_ids = (
        db.query(Notification.id)
        .outerjoin(
            UserNotificationRead,
            and_(
                UserNotificationRead.notification_id == Notification.id,
                UserNotificationRead.user_id == user_id
            )
        )
        .filter(base_filter)
        .filter(UserNotificationRead.id.is_(None))
        .all()
    )

    for (nid,) in unread_ids:
        new_read = UserNotificationRead(
            user_id=user_id,
            notification_id=nid
        )
        db.add(new_read)

    db.commit()
    return 0
