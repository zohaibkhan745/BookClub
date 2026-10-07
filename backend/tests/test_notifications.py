import pytest
from unittest.mock import patch
from app.models.notification import Notification, UserNotificationRead
from app.models.book import Book
from app.models.user import User
from app.services import notification_service, user_service
from app.auth.dependencies import get_current_user, get_optional_user, AuthUser
from app.main import app


def test_get_notifications_empty(client, db_session):
    """Test getting notifications when none exist."""
    response = client.get("/api/v1/notifications")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert data["unread_count"] == 0


def test_guest_unread_count_is_zero(client, db_session):
    """Test that unauthenticated guests always get unread_count=0, even with notifications present."""
    book = Book(
        title="Guest Test Book",
        author="Author",
        category="General",
        slug="guest-test-book",
        user_id="some_user"
    )
    db_session.add(book)
    db_session.commit()
    notification_service.create_book_upload_notification(
        db=db_session,
        book=book,
        actor_id="some_user",
        actor_name="Author"
    )
    db_session.commit()

    # Guest request
    response = client.get("/api/v1/notifications")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
    # Guests must never receive an unread badge counter
    assert data["unread_count"] == 0
    # Every item should have is_read=False for guests
    assert all(item["is_read"] is False for item in data["data"])


def test_create_book_notification_service(client, db_session):
    """Test creating a book notification via service and fetching it."""
    book = Book(
        title="Test Driven Development",
        author="Kent Beck",
        category="Technology",
        slug="test-driven-development",
        cover_image="https://example.com/cover.jpg",
        user_id="user_uploader_123",
        listed_by="Kent Beck Fan"
    )
    db_session.add(book)
    db_session.commit()
    db_session.refresh(book)

    # Create notification
    notif = notification_service.create_book_upload_notification(
        db=db_session,
        book=book,
        actor_id="user_uploader_123",
        actor_name="Kent Beck Fan"
    )
    db_session.commit()

    assert notif.id is not None
    assert notif.type == "BOOK_UPLOADED"
    assert "Test Driven Development" in notif.message
    assert notif.book_id == book.id
    assert notif.book_slug == "test-driven-development"

    # Guest user view
    response = client.get("/api/v1/notifications")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    tdd_notif = next((n for n in res_data["data"] if n["book_slug"] == "test-driven-development"), None)
    assert tdd_notif is not None
    assert tdd_notif["title"] == "New Book Uploaded"


def test_uploader_does_not_have_unread_notification(client, db_session):
    """Test that the user who uploaded the book has their own upload marked as read."""
    uploader_id = "uploader_user_456"
    other_user_id = "other_user_789"

    book = Book(
        title="Clean Architecture",
        author="Robert C. Martin",
        category="Technology",
        slug="clean-architecture",
        user_id=uploader_id,
        listed_by="Bob"
    )
    db_session.add(book)
    db_session.commit()
    db_session.refresh(book)

    # Create notification
    notif = notification_service.create_book_upload_notification(
        db=db_session,
        book=book,
        actor_id=uploader_id,
        actor_name="Bob"
    )
    db_session.commit()

    # Check notifications list for uploader
    uploader_notifs, _ = notification_service.get_notifications_for_user(
        db=db_session,
        user_id=uploader_id
    )
    uploader_target = next(n for n in uploader_notifs if n["id"] == notif.id)
    assert uploader_target["is_read"] is True

    # Check notifications list for other user
    other_notifs, _ = notification_service.get_notifications_for_user(
        db=db_session,
        user_id=other_user_id
    )
    other_target = next(n for n in other_notifs if n["id"] == notif.id)
    assert other_target["is_read"] is False


def test_mark_valid_notification_as_read_api(client, db_session):
    """Test marking a valid notification as read via API endpoint."""
    user_id = "mark_read_user"
    mock_auth = AuthUser(id=user_id, email="reader@example.com", full_name="Reader")

    app.dependency_overrides[get_current_user] = lambda: mock_auth
    app.dependency_overrides[get_optional_user] = lambda: mock_auth

    try:
        book = Book(
            title="Design Patterns",
            author="Gang of Four",
            category="Technology",
            slug="design-patterns",
            user_id="someone_else",
            listed_by="GoF"
        )
        db_session.add(book)
        db_session.commit()
        db_session.refresh(book)

        notif = notification_service.create_book_upload_notification(
            db=db_session,
            book=book,
            actor_id="someone_else",
            actor_name="GoF"
        )
        db_session.commit()

        # Mark as read
        read_res = client.post(f"/api/v1/notifications/{notif.id}/read")
        assert read_res.status_code == 200
        assert read_res.json()["success"] is True

        # Check notification item is_read is True
        res_after = client.get("/api/v1/notifications")
        target = next(n for n in res_after.json()["data"] if n["id"] == notif.id)
        assert target["is_read"] is True

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_optional_user, None)


def test_mark_nonexistent_notification_returns_404(client, db_session):
    """Test that marking a nonexistent notification ID returns 404 Not Found (not 500)."""
    mock_auth = AuthUser(id="user_test_404", email="user404@example.com", full_name="User")
    app.dependency_overrides[get_current_user] = lambda: mock_auth

    try:
        response = client.post("/api/v1/notifications/99999999/read")
        assert response.status_code == 404
        data = response.json()
        assert data["detail"]["code"] == "NOT_FOUND"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_unauthorized_targeted_notification_returns_403(client, db_session):
    """Test that attempting to mark another user's targeted notification returns 403 Forbidden."""
    victim_user_id = "victim_user_111"
    attacker_user_id = "attacker_user_222"

    # Create a targeted notification specifically for victim_user_id
    targeted_notif = Notification(
        user_id=victim_user_id,
        actor_id="system",
        actor_name="System",
        type="SYSTEM_ALERT",
        title="Private Message",
        message="Confidential alert for victim."
    )
    db_session.add(targeted_notif)
    db_session.commit()
    db_session.refresh(targeted_notif)

    # Attacker tries to read victim's notification
    mock_attacker = AuthUser(id=attacker_user_id, email="attacker@example.com", full_name="Attacker")
    app.dependency_overrides[get_current_user] = lambda: mock_attacker

    try:
        response = client.post(f"/api/v1/notifications/{targeted_notif.id}/read")
        assert response.status_code == 403
        data = response.json()
        assert data["detail"]["code"] == "FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_mark_all_notifications_as_read_api(client, db_session):
    """Test marking all notifications as read via API endpoint."""
    user_id = "bulk_read_user"
    mock_auth = AuthUser(id=user_id, email="bulk@example.com", full_name="Bulk Reader")

    app.dependency_overrides[get_current_user] = lambda: mock_auth
    app.dependency_overrides[get_optional_user] = lambda: mock_auth

    try:
        # Create 2 books and notifications
        for i in range(2):
            b = Book(
                title=f"Bulk Book {i}",
                author=f"Author {i}",
                category="General",
                slug=f"bulk-book-{i}",
                user_id="another_person"
            )
            db_session.add(b)
            db_session.commit()
            notification_service.create_book_upload_notification(
                db=db_session,
                book=b,
                actor_id="another_person",
                actor_name="Author"
            )
            db_session.commit()

        # Mark all as read
        read_all_res = client.post("/api/v1/notifications/read-all")
        assert read_all_res.status_code == 200
        assert read_all_res.json()["success"] is True
        assert read_all_res.json()["unread_count"] == 0

        # Verify through GET
        res = client.get("/api/v1/notifications")
        assert res.json()["unread_count"] == 0
        for item in res.json()["data"]:
            assert item["is_read"] is True

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_optional_user, None)


def test_book_upload_api_creates_notification_and_credits_atomically(client, db_session):
    """End-to-end test: POST /api/v1/books creates book, credits user, and creates broadcast notification."""
    uploader_id = "api_uploader_id"
    mock_auth = AuthUser(id=uploader_id, email="uploader@example.com", full_name="Uploader User")

    app.dependency_overrides[get_current_user] = lambda: mock_auth
    app.dependency_overrides[get_optional_user] = lambda: mock_auth

    try:
        # Sync user in db with initial 1 credit
        user = user_service.sync_supabase_user(
            db_session,
            supabase_id=uploader_id,
            email="uploader@example.com",
            full_name="Uploader User"
        )
        assert user.credits == 1

        payload = {
            "title": "Refactoring Improving the Design of Existing Code",
            "author": "Martin Fowler",
            "category": "Technology",
            "description": "A guide to refactoring.",
            "condition": "like-new",
            "listing_type": "lend"
        }

        response = client.post("/api/v1/books", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        created_slug = data["data"]["slug"]

        # Check user credit incremented atomically from 1 to 2
        db_session.refresh(user)
        assert user.credits == 2

        # Check notification was created and is auto-marked as read for uploader
        notifs, unread_count = notification_service.get_notifications_for_user(
            db=db_session,
            user_id=uploader_id
        )
        created_notif = next((n for n in notifs if n["book_slug"] == created_slug), None)
        assert created_notif is not None
        assert created_notif["is_read"] is True

        # Check for another user, notification is unread
        other_notifs, other_unread = notification_service.get_notifications_for_user(
            db=db_session,
            user_id="other_reader_999"
        )
        other_target = next((n for n in other_notifs if n["book_slug"] == created_slug), None)
        assert other_target is not None
        assert other_target["is_read"] is False
        assert other_unread >= 1

    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_optional_user, None)


def test_book_upload_transaction_rollback_on_failure(client, db_session):
    """Test that if notification creation fails, the entire transaction rolls back cleanly."""
    uploader_id = "fail_uploader_id"
    mock_auth = AuthUser(id=uploader_id, email="fail_user@example.com", full_name="Fail User")

    app.dependency_overrides[get_current_user] = lambda: mock_auth

    try:
        # Sync user in db with initial 1 credit
        user = user_service.sync_supabase_user(
            db_session,
            supabase_id=uploader_id,
            email="fail_user@example.com",
            full_name="Fail User"
        )
        assert user.credits == 1

        payload = {
            "title": "Doomed Book That Should Rollback",
            "author": "Author",
            "category": "Technology",
            "description": "Will not be saved.",
            "condition": "good",
            "listing_type": "lend"
        }

        # Mock notification creation to fail
        with patch("app.services.notification_service.create_book_upload_notification", side_effect=RuntimeError("Simulated notification DB error")):
            response = client.post("/api/v1/books", json=payload)
            assert response.status_code == 500

        # Verify book was rolled back and does NOT exist in DB
        rolled_back_book = db_session.query(Book).filter(Book.title == "Doomed Book That Should Rollback").first()
        assert rolled_back_book is None

        # Verify credits were rolled back and remain 1
        db_session.refresh(user)
        assert user.credits == 1

    finally:
        app.dependency_overrides.pop(get_current_user, None)
