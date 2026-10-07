"""
Tests for Web Push notification service, subscriptions, and API endpoints.
Verifies iOS PWA and Android notification delivery and lifecycle management.
"""
import pytest
from unittest.mock import patch, MagicMock
from app.models.push_subscription import PushSubscription
from app.models.book import Book, BookCondition, ListingType
from app.services import push_service


def test_get_vapid_public_key(client):
    """VAPID public key endpoint returns configured key."""
    response = client.get("/api/v1/notifications/push/public-key")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "public_key" in data["data"]
    assert len(data["data"]["public_key"]) > 20


def test_subscribe_and_unsubscribe_push(client, db_session, mock_user_auth):
    """Can subscribe a device to push notifications and unsubscribe."""
    endpoint = "https://fcm.googleapis.com/fcm/send/test-device-token-123"
    payload = {
        "endpoint": endpoint,
        "keys": {
            "p256dh": "BIPTTYpty52aX1hD9K36u6f-8q5s7gJ22J_bF6Y9xI8=",
            "auth": "k8d9s7a6d8s7a6s5"
        },
        "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
    }

    # 1. Subscribe
    sub_res = client.post("/api/v1/notifications/push/subscribe", json=payload)
    assert sub_res.status_code == 200
    assert sub_res.json()["success"] is True

    # Verify stored in database
    sub = db_session.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).first()
    assert sub is not None
    assert sub.p256dh == payload["keys"]["p256dh"]
    assert sub.auth == payload["keys"]["auth"]

    # 2. Check status
    status_res = client.get(f"/api/v1/notifications/push/status?endpoint={endpoint}")
    assert status_res.status_code == 200
    assert status_res.json()["is_subscribed"] is True

    # 3. Unsubscribe
    unsub_res = client.post("/api/v1/notifications/push/unsubscribe", json={"endpoint": endpoint})
    assert unsub_res.status_code == 200
    assert unsub_res.json()["success"] is True

    # Verify removed from database
    sub_after = db_session.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).first()
    assert sub_after is None


def test_subscribe_upsert_updates_existing(client, db_session):
    """Subscribing with same endpoint updates existing record rather than creating duplicate."""
    endpoint = "https://web.push.apple.com/test-ios-endpoint-456"
    
    # First subscription
    client.post("/api/v1/notifications/push/subscribe", json={
        "endpoint": endpoint,
        "keys": {"p256dh": "key1", "auth": "auth1"},
        "user_agent": "iOS Safari PWA"
    })
    
    # Second subscription with updated keys
    client.post("/api/v1/notifications/push/subscribe", json={
        "endpoint": endpoint,
        "keys": {"p256dh": "key2_updated", "auth": "auth2_updated"},
        "user_agent": "iOS Standalone PWA"
    })

    records = db_session.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).all()
    assert len(records) == 1
    assert records[0].p256dh == "key2_updated"
    assert records[0].auth == "auth2_updated"
    assert records[0].user_agent == "iOS Standalone PWA"


def test_broadcast_book_upload_push(db_session):
    """Broadcasting push sends to subscribed devices and skips uploader."""
    db_session.query(PushSubscription).delete()
    db_session.commit()

    uploader_id = "uploader-user-uuid"
    # Create subscriber A (other member)
    push_service.save_subscription(
        db=db_session,
        endpoint="https://push.other-device/sub-a",
        p256dh="key_a",
        auth="auth_a",
        user_id="other-user-uuid"
    )
    # Create subscriber B (the uploader themselves)
    push_service.save_subscription(
        db=db_session,
        endpoint="https://push.uploader-device/sub-b",
        p256dh="key_b",
        auth="auth_b",
        user_id=uploader_id
    )

    book = Book(
        title="Dune",
        author="Frank Herbert",
        category="Science Fiction",
        condition=BookCondition.like_new,
        listing_type=ListingType.borrow,
        user_id=uploader_id,
        listed_by="Paul Atreides",
        slug="dune-123456",
        is_available=True
    )
    db_session.add(book)
    db_session.flush()

    with patch("app.services.push_service.send_single_push", return_value=(True, False)) as mock_send:
        sent = push_service.broadcast_book_upload_push(
            db=db_session,
            book=book,
            uploader_id=uploader_id,
            uploader_name="Paul Atreides"
        )
        # Should send only to other member (sub-a), not uploader (sub-b)
        assert sent == 1
        assert mock_send.call_count == 1
        call_sub = mock_send.call_args[1]["sub"]
        assert call_sub.endpoint == "https://push.other-device/sub-a"


def test_broadcast_prunes_expired_subscriptions(db_session):
    """Broadcasting prunes subscriptions that return expired (410/404)."""
    db_session.query(PushSubscription).delete()
    db_session.commit()

    endpoint_expired = "https://push.expired-device/sub-expired"
    push_service.save_subscription(
        db=db_session,
        endpoint=endpoint_expired,
        p256dh="expired_key",
        auth="expired_auth",
        user_id="expired-user"
    )

    book = Book(
        title="Foundation",
        author="Isaac Asimov",
        category="Science Fiction",
        condition=BookCondition.good,
        listing_type=ListingType.borrow,
        user_id="some-uploader-id",
        listed_by="Hari Seldon",
        slug="foundation-654321",
        is_available=True
    )
    db_session.add(book)
    db_session.flush()

    # Mock send_single_push returning (success=False, is_expired=True)
    with patch("app.services.push_service.send_single_push", return_value=(False, True)):
        push_service.broadcast_book_upload_push(
            db=db_session,
            book=book,
            uploader_id="some-uploader-id",
            uploader_name="Hari Seldon"
        )

    # Expired subscription should now be deleted from DB
    remaining = db_session.query(PushSubscription).filter(PushSubscription.endpoint == endpoint_expired).first()
    assert remaining is None


def test_send_test_push_endpoint(client, db_session):
    """Test push notification endpoint calls service and reports success."""
    endpoint = "https://fcm.googleapis.com/fcm/send/test-endpoint"
    client.post("/api/v1/notifications/push/subscribe", json={
        "endpoint": endpoint,
        "keys": {"p256dh": "key", "auth": "auth"}
    })

    with patch("app.services.push_service.send_single_push", return_value=(True, False)):
        response = client.post(f"/api/v1/notifications/push/test?endpoint={endpoint}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["sent_count"] == 1
