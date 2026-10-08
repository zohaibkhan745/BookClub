"""
Web Push Service for dispatching push notifications to iOS (Home Screen PWA) and Android devices.
Uses Voluntary Application Server Identification (VAPID) and Web Push standard (RFC 8291 / 8292).
"""
import json
import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.config import get_settings
from app.models.push_subscription import PushSubscription
from app.models.book import Book

logger = logging.getLogger(__name__)


def save_subscription(
    db: Session,
    endpoint: str,
    p256dh: str,
    auth: str,
    user_id: Optional[str] = None,
    user_agent: Optional[str] = None
) -> PushSubscription:
    """
    Save or update a push subscription for a browser/device.
    """
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).first()
    if existing:
        existing.p256dh = p256dh
        existing.auth = auth
        if user_id:
            existing.user_id = user_id
        if user_agent:
            existing.user_agent = user_agent
        db.commit()
        db.refresh(existing)
        return existing

    new_sub = PushSubscription(
        user_id=user_id,
        endpoint=endpoint,
        p256dh=p256dh,
        auth=auth,
        user_agent=user_agent
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub


def remove_subscription(db: Session, endpoint: str) -> bool:
    """
    Remove a push subscription when user disables notifications or device endpoint expires.
    """
    sub = db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).first()
    if sub:
        db.delete(sub)
        db.commit()
        return True
    return False


def is_user_subscribed(db: Session, user_id: Optional[str] = None, endpoint: Optional[str] = None) -> bool:
    """
    Check if a user or endpoint is currently registered for push notifications.
    """
    if endpoint:
        return db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).count() > 0
    if user_id:
        return db.query(PushSubscription).filter(PushSubscription.user_id == user_id).count() > 0
    return False


def send_single_push(
    sub: PushSubscription,
    payload: Dict[str, Any],
    vapid_private_key: str,
    vapid_claims: Dict[str, str]
) -> tuple[bool, bool]:
    """
    Send Web Push to a single subscription.
    Returns (success: bool, is_expired: bool).
    If is_expired is True, the subscription endpoint is no longer valid (404/410) and should be pruned.
    """
    try:
        import pywebpush
    except ImportError:
        logger.error("pywebpush package is not installed; unable to dispatch web push.")
        return False, False

    subscription_info = {
        "endpoint": sub.endpoint,
        "keys": {
            "p256dh": sub.p256dh,
            "auth": sub.auth
        }
    }

    try:
        pywebpush.webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=vapid_private_key,
            vapid_claims=vapid_claims,
            ttl=86400,  # 24 hours time to live
            timeout=5  # Fast 5-second network timeout to prevent request blocking
        )
        return True, False
    except pywebpush.WebPushException as e:
        status_code = getattr(e.response, "status_code", None) if hasattr(e, "response") else None
        if status_code in (404, 410):
            # Endpoint is expired or unsubscribed on client device
            logger.info("Push subscription expired (status %s) for endpoint %s", status_code, sub.endpoint[:40])
            return False, True
        logger.warning("Failed to send web push to endpoint %s: %s", sub.endpoint[:40], e)
        return False, False
    except Exception as e:
        logger.error("Unexpected error dispatching web push: %s", e)
        return False, False


def broadcast_book_upload_push(
    db: Session,
    book: Book,
    uploader_id: Optional[str] = None,
    uploader_name: Optional[str] = None
) -> int:
    """
    Send push notification to all subscribed devices when a new book is uploaded.
    Excludes the uploader so they don't get alerted for their own upload.
    Expired/invalid subscriptions are automatically cleaned up from the database.
    Returns number of successful pushes.
    """
    settings = get_settings()
    if not settings.vapid_private_key:
        logger.warning("VAPID_PRIVATE_KEY not configured; skipping push dispatch.")
        return 0

    query = db.query(PushSubscription)
    if uploader_id:
        # Don't push to uploader's own registered accounts
        query = query.filter(
            or_(PushSubscription.user_id.is_(None), PushSubscription.user_id != uploader_id)
        )

    subscriptions = query.all()
    if not subscriptions:
        return 0

    display_name = uploader_name or "A member"
    payload = {
        "title": "New Book Uploaded",
        "body": f"{display_name} added '{book.title}' by {book.author}.",
        "icon": "/icon-192.png",
        "badge": "/icon-192.png",
        "image": book.cover_image_thumb_url or book.cover_image or None,
        "tag": f"book-upload-{book.id}",
        "url": f"/book/{book.slug or book.id}",
        "book_id": book.id,
        "book_slug": book.slug
    }

    vapid_claims = {"sub": settings.vapid_claims_sub}
    success_count = 0
    expired_ids = []

    for sub in subscriptions:
        success, is_expired = send_single_push(
            sub=sub,
            payload=payload,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims=vapid_claims
        )
        if success:
            success_count += 1
        elif is_expired:
            expired_ids.append(sub.id)

    # Prune expired subscriptions in batch
    if expired_ids:
        try:
            db.query(PushSubscription).filter(PushSubscription.id.in_(expired_ids)).delete(synchronize_session=False)
            db.commit()
            logger.info("Pruned %d expired push subscriptions.", len(expired_ids))
        except Exception as e:
            db.rollback()
            logger.error("Failed to prune expired push subscriptions: %s", e)

    logger.info("Broadcasted book upload push: %d successful of %d subscriptions.", success_count, len(subscriptions))
    return success_count


def send_test_push(
    db: Session,
    user_id: Optional[str] = None,
    endpoint: Optional[str] = None
) -> int:
    """
    Send an immediate test push notification to a user's registered devices (or specific endpoint).
    Enables users to verify lockscreen notifications on iPhone or Android immediately.
    """
    settings = get_settings()
    if not settings.vapid_private_key:
        logger.warning("VAPID_PRIVATE_KEY not configured; cannot send test push.")
        return 0

    query = db.query(PushSubscription)
    if endpoint:
        query = query.filter(PushSubscription.endpoint == endpoint)
    elif user_id:
        query = query.filter(PushSubscription.user_id == user_id)
    else:
        return 0

    subs = query.all()
    if not subs:
        return 0

    payload = {
        "title": "Book Club Notifications Active!",
        "body": "Push notifications are working! You'll be alerted whenever a new book is uploaded.",
        "icon": "/icon-192.png",
        "badge": "/icon-192.png",
        "tag": "book-club-push-test",
        "url": "/library"
    }

    vapid_claims = {"sub": settings.vapid_claims_sub}
    success_count = 0
    expired_ids = []

    for sub in subs:
        success, is_expired = send_single_push(
            sub=sub,
            payload=payload,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims=vapid_claims
        )
        if success:
            success_count += 1
        elif is_expired:
            expired_ids.append(sub.id)

    if expired_ids:
        try:
            db.query(PushSubscription).filter(PushSubscription.id.in_(expired_ids)).delete(synchronize_session=False)
            db.commit()
        except Exception:
            db.rollback()

    return success_count


def send_targeted_push(
    db: Session,
    target_user_id: str,
    title: str,
    body: str,
    url: str,
    book: Optional[Book] = None,
    tag: Optional[str] = None
) -> int:
    """
    Send push notification to all devices registered to a specific user.
    """
    if not target_user_id:
        return 0

    settings = get_settings()
    if not settings.vapid_private_key:
        logger.warning("VAPID_PRIVATE_KEY not configured; skipping targeted push dispatch.")
        return 0

    subscriptions = db.query(PushSubscription).filter(
        PushSubscription.user_id == target_user_id
    ).all()

    if not subscriptions:
        return 0

    payload = {
        "title": title,
        "body": body,
        "icon": "/icon-192.png",
        "badge": "/icon-192.png",
        "image": (book.cover_image_thumb_url or book.cover_image) if book else None,
        "tag": tag or f"notif-{target_user_id}",
        "url": url,
        "book_id": book.id if book else None,
        "book_slug": book.slug if book else None,
    }

    vapid_claims = {"sub": settings.vapid_claims_sub}
    success_count = 0
    expired_ids = []

    for sub in subscriptions:
        success, is_expired = send_single_push(
            sub=sub,
            payload=payload,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims=vapid_claims
        )
        if success:
            success_count += 1
        elif is_expired:
            expired_ids.append(sub.id)

    if expired_ids:
        try:
            db.query(PushSubscription).filter(PushSubscription.id.in_(expired_ids)).delete(synchronize_session=False)
            db.commit()
        except Exception as e:
            logger.warning("Failed to clean up expired push subscriptions: %s", e)
            db.rollback()

    return success_count


def send_borrow_request_push(
    db: Session,
    book: Book,
    borrower_name: str,
    owner_id: str
) -> int:
    """
    Send push notification to the book owner when someone requests their book.
    """
    display_name = borrower_name or "A member"
    return send_targeted_push(
        db=db,
        target_user_id=owner_id,
        title="New Borrow Request",
        body=f"{display_name} requested to borrow '{book.title}'.",
        url=f"/book/{book.slug or book.id}",
        book=book,
        tag=f"borrow-request-{book.id}"
    )


def send_borrow_approved_push(
    db: Session,
    book: Book,
    owner_name: str,
    borrower_id: str
) -> int:
    """
    Send push notification to the borrower when their borrow request is approved.
    """
    display_name = owner_name or "The owner"
    return send_targeted_push(
        db=db,
        target_user_id=borrower_id,
        title="Borrow Request Approved",
        body=f"{display_name} approved your request to borrow '{book.title}'!",
        url=f"/book/{book.slug or book.id}",
        book=book,
        tag=f"borrow-approved-{book.id}"
    )
