import pytest
from fastapi.testclient import TestClient
from app.models.book import Book
from app.models.user import User

def setup_user_data(db_session, mock_user_auth):
    db_session.query(Book).delete()
    db_session.query(User).delete()
    db_session.commit()

    user = User(
        id=mock_user_auth["id"],
        username="reader_one",
        email=mock_user_auth["email"],
        full_name=mock_user_auth["full_name"],
        credits=5
    )
    user2 = User(
        id="user_two_id",
        username="reader_two",
        email="two@example.com",
        full_name="Reader Two",
        credits=15
    )
    db_session.add_all([user, user2])
    
    book = Book(
        id=201,
        title="Sample Book",
        author="Author",
        category="Fiction",
        user_id=user.id,
        is_available=True
    )
    db_session.add(book)
    db_session.commit()
    return user, user2

def test_get_current_user_profile(client, db_session, mock_user_auth):
    setup_user_data(db_session, mock_user_auth)
    response = client.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["id"] == mock_user_auth["id"]
    assert data["data"]["email"] == mock_user_auth["email"]

def test_get_current_user_stats(client, db_session, mock_user_auth):
    setup_user_data(db_session, mock_user_auth)
    response = client.get("/api/v1/users/me/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["books_listed"] == 1
    assert data["data"]["credits"]["total"] == 5

def test_get_leaderboard_batch(client, db_session, mock_user_auth):
    setup_user_data(db_session, mock_user_auth)
    response = client.get("/api/v1/users/leaderboard?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 2
    # Leaderboard ordered by credits desc
    assert data["data"][0]["credits"] == 15
    assert data["data"][1]["credits"] == 5
    assert data["data"][1]["books_uploaded"] == 1

def test_sync_credits_requires_admin(client, db_session, mock_user_auth):
    # Regular user attempting admin sync endpoint
    response = client.post("/api/v1/users/sync-credits")
    assert response.status_code == 403
    assert "code" in response.json()["detail"]

def test_sync_credits_with_admin(client, db_session, mock_admin_auth):
    # With admin credentials
    response = client.post("/api/v1/users/sync-credits")
    assert response.status_code == 200
    assert response.json()["success"] is True
