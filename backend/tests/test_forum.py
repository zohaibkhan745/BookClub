import pytest
from fastapi.testclient import TestClient
from app.models.user import User
from app.models.forum import ForumThread, ForumReply

def setup_forum_user(db_session, mock_user_auth):
    db_session.query(ForumReply).delete()
    db_session.query(ForumThread).delete()
    db_session.query(User).delete()
    db_session.commit()

    user = User(
        id=mock_user_auth["id"],
        username="forum_user",
        email=mock_user_auth["email"],
        full_name=mock_user_auth["full_name"],
        credits=5
    )
    db_session.add(user)
    db_session.commit()
    return user

def test_create_and_list_threads(client, db_session, mock_user_auth):
    setup_forum_user(db_session, mock_user_auth)

    # Create thread
    create_res = client.post(
        "/api/v1/forum/threads",
        json={
            "title": "Favorite Sci-Fi Classics?",
            "content": "What are your all-time favorite science fiction books?"
        }
    )
    assert create_res.status_code == 201
    thread_id = create_res.json()["data"]["id"]

    # List threads
    list_res = client.get("/api/v1/forum/threads")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1
    assert list_res.json()["data"][0]["id"] == thread_id

def test_replies_lifecycle_and_invalidation(client, db_session, mock_user_auth):
    setup_forum_user(db_session, mock_user_auth)

    # Create thread
    thread_res = client.post(
        "/api/v1/forum/threads",
        json={
            "title": "Book Recommendations for Autumn",
            "content": "Looking for cozy mystery and classic literature suggestions."
        }
    )
    thread_id = thread_res.json()["data"]["id"]

    # Post reply
    reply_res = client.post(
        f"/api/v1/forum/threads/{thread_id}/replies",
        json={"content": "You must read Agatha Christie's And Then There Were None!"}
    )
    assert reply_res.status_code == 201
    reply_id = reply_res.json()["data"]["id"]

    # View thread details
    detail_res = client.get(f"/api/v1/forum/threads/{thread_id}")
    assert detail_res.status_code == 200
    assert len(detail_res.json()["data"]["replies"]) == 1

    # Delete reply
    del_res = client.delete(f"/api/v1/forum/replies/{reply_id}")
    assert del_res.status_code == 200

    # View thread details again (verifies cache was invalidated on delete)
    detail_after = client.get(f"/api/v1/forum/threads/{thread_id}")
    assert detail_after.status_code == 200
    assert len(detail_after.json()["data"]["replies"]) == 0
