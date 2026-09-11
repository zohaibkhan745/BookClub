from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_delete_all_books_without_admin(client, mock_user_auth):
    # This should fail because the user is not an admin
    response = client.delete("/api/v1/books/all")
    assert response.status_code == 403
    assert "code" in response.json()["detail"]

def test_delete_all_users_without_admin(client, mock_user_auth):
    # This should fail because the user is not an admin
    response = client.delete("/api/v1/users/all")
    assert response.status_code == 403
    assert "code" in response.json()["detail"]

def test_delete_all_books_with_admin(client, mock_admin_auth, db_session):
    # Mock the internal logic or just rely on an empty db
    response = client.delete("/api/v1/books/all")
    assert response.status_code == 200
    assert "message" in response.json()
