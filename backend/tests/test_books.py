import pytest
from fastapi.testclient import TestClient
from app.models.book import Book
from app.models.user import User
from app.models.borrow_record import BorrowRecord, BorrowStatus
from app.cache import cache
from app.services.borrow_service import invalidate_borrow_cache

def setup_book_data(db_session, mock_user_auth):
    cache.clear()
    db_session.query(BorrowRecord).delete()
    db_session.query(Book).delete()
    db_session.query(User).delete()
    db_session.commit()

    user = User(
        id=mock_user_auth["id"],
        username="testuser",
        email=mock_user_auth["email"],
        full_name=mock_user_auth["full_name"],
        credits=3
    )
    db_session.add(user)

    book1 = Book(
        id=101,
        title="1984",
        author="George Orwell",
        category="Dystopian",
        user_id=user.id,
        listed_by=user.full_name,
        is_available=True
    )
    book2 = Book(
        id=102,
        title="Brave New World",
        author="Aldous Huxley",
        category="Sci-Fi",
        user_id="other_user_id",
        listed_by="Other User",
        is_available=True
    )
    db_session.add_all([book1, book2])
    db_session.commit()
    return book1, book2

def test_get_books_sections(client, db_session, mock_user_auth):
    setup_book_data(db_session, mock_user_auth)
    response = client.get("/api/v1/books")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "trending" in data["data"]
    assert "newArrivals" in data["data"]
    assert "popular" in data["data"]

def test_get_all_books_paginated(client, db_session, mock_user_auth):
    setup_book_data(db_session, mock_user_auth)
    response = client.get("/api/v1/books/all?limit=1")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 1
    assert data["pagination"]["has_next"] is True
    assert data["pagination"]["next_cursor"] is not None

def test_get_single_book(client, db_session, mock_user_auth):
    b1, _ = setup_book_data(db_session, mock_user_auth)
    response = client.get(f"/api/v1/books/{b1.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["title"] == "1984"
    assert data["data"]["borrowStatus"]["isBorrowed"] is False

def test_create_book(client, db_session, mock_user_auth):
    setup_book_data(db_session, mock_user_auth)
    payload = {
        "title": "Dune",
        "author": "Frank Herbert",
        "category": "Sci-Fi",
        "listing_type": "lend",
        "condition": "good",
        "description": "Epic science fiction",
        "whatsapp_number": "+1234567890"
    }
    response = client.post("/api/v1/books", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["title"] == "Dune"
    assert data["data"]["ownerId"] == mock_user_auth["id"]

def test_get_user_library_batch(client, db_session, mock_user_auth):
    setup_book_data(db_session, mock_user_auth)
    response = client.get("/api/v1/user/library")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "uploaded" in data["data"]
    assert "borrowed" in data["data"]
    assert len(data["data"]["uploaded"]) == 1
    assert data["data"]["uploaded"][0]["id"] == "101"

def test_delete_book_collateral_check(client, db_session, mock_user_auth):
    b1, b2 = setup_book_data(db_session, mock_user_auth)
    user = db_session.query(User).filter(User.id == mock_user_auth["id"]).first()
    
    # User has 1 credit, and is actively borrowing 1 book
    user.credits = 1
    borrow_record = BorrowRecord(
        id="br-1",
        book_id=b2.id,
        borrower_id=user.id,
        status=BorrowStatus.borrowed.value
    )
    db_session.add(borrow_record)
    db_session.commit()

    # Deleting their uploaded book would reduce credits to 0 (future balance = 0 < 1 loan)
    response = client.delete(f"/api/v1/books/{b1.id}")
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "COLLATERAL_BANKRUPTCY"


def test_slug_generation_and_collision(client, db_session, mock_user_auth):
    setup_book_data(db_session, mock_user_auth)
    
    # Create first book
    payload1 = {
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "category": "Technology",
        "listing_type": "lend",
        "whatsapp_number": "+1234567890"
    }
    res1 = client.post("/api/v1/books", json=payload1)
    assert res1.status_code == 201
    slug1 = res1.json()["data"]["slug"]
    assert slug1 == "clean-code"
    
    # Create second book with same title (collision test)
    payload2 = {
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "category": "Technology",
        "listing_type": "lend",
        "whatsapp_number": "+1234567890"
    }
    res2 = client.post("/api/v1/books", json=payload2)
    assert res2.status_code == 201
    slug2 = res2.json()["data"]["slug"]
    assert slug2 == "clean-code-2"
    
    # Lookup by slug
    get_res1 = client.get(f"/api/v1/books/{slug1}")
    assert get_res1.status_code == 200
    assert get_res1.json()["data"]["slug"] == "clean-code"
    
    get_res2 = client.get(f"/api/v1/books/{slug2}")
    assert get_res2.status_code == 200
    assert get_res2.json()["data"]["slug"] == "clean-code-2"
    
    # Lookup by legacy integer ID
    book2_id = res2.json()["data"]["id"]
    get_res_id = client.get(f"/api/v1/books/{book2_id}")
    assert get_res_id.status_code == 200
    assert get_res_id.json()["data"]["slug"] == "clean-code-2"


def test_reading_journey_timeline_and_privacy(client, db_session, mock_user_auth):
    from datetime import datetime, timedelta, timezone
    b1, _ = setup_book_data(db_session, mock_user_auth)
    
    # 1. Past returned borrow
    borrow_returned = BorrowRecord(
        id="hist-1",
        book_id=b1.id,
        borrower_id=mock_user_auth["id"],
        status=BorrowStatus.returned.value,
        borrowed_at=datetime.now(timezone.utc) - timedelta(days=14),
        returned_at=datetime.now(timezone.utc)
    )
    
    # 2. Cancelled draft request (should be excluded from public journey)
    borrow_cancelled = BorrowRecord(
        id="hist-2",
        book_id=b1.id,
        borrower_id=mock_user_auth["id"],
        status=BorrowStatus.cancelled.value,
        borrowed_at=datetime.now(timezone.utc) - timedelta(days=20)
    )
    
    db_session.add_all([borrow_returned, borrow_cancelled])
    db_session.commit()
    
    res = client.get(f"/api/v1/books/{b1.id}")
    assert res.status_code == 200
    data = res.json()["data"]
    
    journey = data.get("readingJourney", [])
    # Only the returned record should appear; cancelled draft must be excluded
    assert len(journey) == 1
    item = journey[0]
    assert item["status"] == "returned"
    assert item["borrowerName"] == mock_user_auth["full_name"]
    assert item["durationDays"] is not None
    assert item["durationDays"] >= 13
    
    # Privacy verification: no email or phone leaked in journey
    assert "email" not in item
    assert "whatsappNumber" not in item
    assert "phone" not in item


