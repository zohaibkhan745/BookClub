"""
Forum API endpoints for community discussions.

Provides CRUD operations for forum threads and replies.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models import User, ForumThread, ForumReply
from app.auth import get_current_user, AuthUser
from app.cache import cache

router = APIRouter(prefix="/api/v1/forum", tags=["forum"])

# Cache TTL for forum (in seconds)
CACHE_TTL_THREADS = 60  # 1 minute for thread list
CACHE_TTL_THREAD_DETAIL = 30  # 30 seconds for thread detail


# ============================================
# Pydantic Schemas
# ============================================

class ThreadCreate(BaseModel):
    """Schema for creating a new thread."""
    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=10)


class ReplyCreate(BaseModel):
    """Schema for creating a reply."""
    content: str = Field(..., min_length=1)


class AuthorInfo(BaseModel):
    """Author information for threads and replies."""
    id: str
    full_name: str
    username: str


class ReplyResponse(BaseModel):
    """Response schema for a reply."""
    id: int
    content: str
    author: AuthorInfo
    created_at: datetime
    
    class Config:
        from_attributes = True


class ThreadListItem(BaseModel):
    """Response schema for thread list items."""
    id: int
    title: str
    content: str
    author: AuthorInfo
    reply_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ThreadDetailResponse(BaseModel):
    """Response schema for thread details with replies."""
    id: int
    title: str
    content: str
    author: AuthorInfo
    replies: List[ReplyResponse]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# Thread Endpoints
# ============================================

@router.get("/threads", response_model=dict)
async def get_threads(
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """
    GET /forum/threads - Get all forum threads.
    
    Returns threads with author info and reply counts,
    ordered by created_at descending (newest first).
    """
    # Check cache first
    cache_key = f"forum:threads:{limit}:{offset}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    # Query threads with author join and reply count
    threads_query = (
        db.query(
            ForumThread,
            User.id.label("author_id"),
            User.full_name.label("author_full_name"),
            User.username.label("author_username"),
            func.count(ForumReply.id).label("reply_count")
        )
        .join(User, ForumThread.user_id == User.id)
        .outerjoin(ForumReply, ForumThread.id == ForumReply.thread_id)
        .group_by(ForumThread.id, User.id)
        .order_by(ForumThread.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    
    results = threads_query.all()
    
    threads = []
    for thread, author_id, author_full_name, author_username, reply_count in results:
        threads.append({
            "id": thread.id,
            "title": thread.title,
            "content": thread.content[:200] + "..." if len(thread.content) > 200 else thread.content,
            "author": {
                "id": author_id,
                "full_name": author_full_name or "Unknown",
                "username": author_username or "unknown"
            },
            "reply_count": reply_count,
            "created_at": thread.created_at.isoformat() if thread.created_at else None
        })
    
    # Get total count
    total = db.query(func.count(ForumThread.id)).scalar()
    
    response = {
        "success": True,
        "data": threads,
        "total": total
    }
    
    # Cache the response
    cache.set(cache_key, response, CACHE_TTL_THREADS)
    
    return response


@router.get("/threads/{thread_id}", response_model=dict)
async def get_thread_detail(
    thread_id: int,
    db: Session = Depends(get_db)
):
    """
    GET /forum/threads/{id} - Get thread details with all replies.
    
    Returns full thread content with author info and all replies.
    """
    # Check cache first
    cache_key = f"forum:thread:{thread_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    # Get thread with author
    thread = (
        db.query(ForumThread)
        .filter(ForumThread.id == thread_id)
        .first()
    )
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    # Get author info
    author = db.query(User).filter(User.id == thread.user_id).first()
    
    # Get replies with author info
    replies_query = (
        db.query(ForumReply, User)
        .join(User, ForumReply.user_id == User.id)
        .filter(ForumReply.thread_id == thread_id)
        .order_by(ForumReply.created_at.asc())
    )
    
    replies = []
    for reply, reply_author in replies_query.all():
        replies.append({
            "id": reply.id,
            "content": reply.content,
            "author": {
                "id": reply_author.id,
                "full_name": reply_author.full_name or "Unknown",
                "username": reply_author.username or "unknown"
            },
            "created_at": reply.created_at.isoformat() if reply.created_at else None
        })
    
    response = {
        "success": True,
        "data": {
            "id": thread.id,
            "title": thread.title,
            "content": thread.content,
            "author": {
                "id": author.id if author else "",
                "full_name": author.full_name if author else "Unknown",
                "username": author.username if author else "unknown"
            },
            "replies": replies,
            "created_at": thread.created_at.isoformat() if thread.created_at else None
        }
    }
    
    # Cache the response
    cache.set(cache_key, response, CACHE_TTL_THREAD_DETAIL)
    
    return response


@router.post("/threads", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_thread(
    thread_data: ThreadCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    POST /forum/threads - Create a new discussion thread.
    
    Requires authentication. Creates a new thread with the current user as author.
    """
    # Ensure user exists in local database
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found. Please sync your account first."
        )
    
    # Create thread
    new_thread = ForumThread(
        title=thread_data.title,
        content=thread_data.content,
        user_id=current_user.id
    )
    
    db.add(new_thread)
    db.commit()
    db.refresh(new_thread)
    
    # Invalidate threads list cache
    cache.invalidate_pattern("forum:threads:")
    
    return {
        "success": True,
        "message": "Thread created successfully",
        "data": {
            "id": new_thread.id,
            "title": new_thread.title,
            "content": new_thread.content,
            "author": {
                "id": user.id,
                "full_name": user.full_name,
                "username": user.username
            },
            "reply_count": 0,
            "created_at": new_thread.created_at.isoformat() if new_thread.created_at else None
        }
    }


@router.delete("/threads/{thread_id}", response_model=dict)
async def delete_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    DELETE /forum/threads/{id} - Delete a thread.
    
    Only the thread author can delete their thread.
    """
    thread = db.query(ForumThread).filter(ForumThread.id == thread_id).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    if thread.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own threads"
        )
    
    db.delete(thread)
    db.commit()
    
    # Invalidate caches
    cache.invalidate_pattern("forum:threads:")
    cache.delete(f"forum:thread:{thread_id}")
    
    return {
        "success": True,
        "message": "Thread deleted successfully"
    }


# ============================================
# Reply Endpoints
# ============================================

@router.post("/threads/{thread_id}/replies", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_reply(
    thread_id: int,
    reply_data: ReplyCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    POST /forum/threads/{id}/replies - Create a reply on a thread.
    
    Requires authentication. Adds a reply to the specified thread.
    """
    # Check thread exists
    thread = db.query(ForumThread).filter(ForumThread.id == thread_id).first()
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    # Ensure user exists in local database
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found. Please sync your account first."
        )
    
    # Create reply
    new_reply = ForumReply(
        content=reply_data.content,
        thread_id=thread_id,
        user_id=current_user.id
    )
    
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)
    
    # Invalidate thread detail cache and threads list (reply count changed)
    cache.delete(f"forum:thread:{thread_id}")
    cache.invalidate_pattern("forum:threads:")
    
    return {
        "success": True,
        "message": "Reply posted successfully",
        "data": {
            "id": new_reply.id,
            "content": new_reply.content,
            "author": {
                "id": user.id,
                "full_name": user.full_name,
                "username": user.username
            },
            "created_at": new_reply.created_at.isoformat() if new_reply.created_at else None
        }
    }


@router.delete("/replies/{reply_id}", response_model=dict)
async def delete_reply(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    DELETE /forum/replies/{id} - Delete a reply.
    
    Only the reply author can delete their reply.
    """
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    if reply.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own replies"
        )
    
    db.delete(reply)
    db.commit()
    
    return {
        "success": True,
        "message": "Reply deleted successfully"
    }
