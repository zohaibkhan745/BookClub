from fastapi.testclient import TestClient
from app.models.book import Book
from app.models.user import User
from app.models.borrow_record import BorrowRecord, BorrowStatus
import uuid

def setup_test_data(db_session, mock_user_auth):
    # Clear tables to avoid Unique constraint failures
    db_session.query(Book).delete()
    db_session.query(User).delete()
    db_session.query(BorrowRecord).delete()
    db_session.commit()

    # Add a mock user
    user = User(
        id=mock_user_auth["id"],
        username="testuser",
        email=mock_user_auth["email"],
        full_name=mock_user_auth["full_name"],
        credits=5
    )
    db_session.add(user)
    
    # Add a second user for ownership
    owner_id = "owner_user_id"
    owner = User(
        id=owner_id,
        username="owneruser",
        email="owner@example.com",
        full_name="Owner User",
        credits=5
    )
    db_session.add(owner)
    
    # Add a test book
    book = Book(
        id=1,
        title="Test Book",
        author="Author",
        category="Fiction",
        user_id=owner_id,
        is_available=True
    )
    db_session.add(book)
    db_session.commit()
    
    return book

def test_borrow_book_success(client, db_session, mock_user_auth):
    book = setup_test_data(db_session, mock_user_auth)
    
    # User requests to borrow the book
    response = client.post(
        "/api/v1/borrow/request",
        json={"book_id": str(book.id)}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "requested"

def test_borrow_book_not_found(client, mock_user_auth):
    response = client.post(
        "/api/v1/borrow/request",
        json={"book_id": "999"}
    )
    assert response.status_code == 404

def test_borrow_book_already_requested(client, db_session, mock_user_auth):
    book = setup_test_data(db_session, mock_user_auth)
    
    # First request
    client.post(
        "/api/v1/borrow/request",
        json={"book_id": str(book.id)}
    )
    
    # Second request should fail
    response = client.post(
        "/api/v1/borrow/request",
        json={"book_id": str(book.id)}
    )
    
    assert response.status_code == 400
    assert "already have a pending" in response.json()["detail"]["message"].lower()
