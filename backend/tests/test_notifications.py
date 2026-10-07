import pytest
from app.models.notification import Notification, UserNotificationRead
from app.models.book import Book
from app.models.user import User
from app.services import notification_service
from app.auth.dependencies import get_current_user, get_optional_user, AuthUser
from app.main import app


def test_get_notifications_empty(client, db_session):
    """Test getting notifications when none exist."""
    response = client.get("/api/v1/notifications")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert isinstance(data["unread_count"], int)


def test_create_book_notification(client, db_session):
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
    """Test that the user who uploaded the book does not get an unread badge for it."""
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



def test_mark_notification_as_read_api(client, db_session):
    """Test marking a notification as read via API endpoint."""
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

        # Before marking: unread count >= 1
        res_before = client.get("/api/v1/notifications")
        assert res_before.status_code == 200
        assert res_before.json()["unread_count"] >= 1

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
