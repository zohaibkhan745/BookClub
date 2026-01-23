"""
Forum models for community discussions.

ForumThread: A discussion topic started by a user.
ForumReply: A reply/comment on a thread.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import uuid


def generate_uuid():
    """Generate a UUID string for new records."""
    return str(uuid.uuid4())


class ForumThread(Base):
    """
    Forum thread/discussion topic.
    
    Users can create threads to discuss books, recommendations, etc.
    Each thread can have multiple replies.
    """
    
    __tablename__ = "forum_threads"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    author = relationship("User", backref="forum_threads")
    replies = relationship("ForumReply", back_populates="thread", cascade="all, delete-orphan", order_by="ForumReply.created_at")


class ForumReply(Base):
    """
    Reply/comment on a forum thread.
    """
    
    __tablename__ = "forum_replies"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(Text, nullable=False)
    thread_id = Column(Integer, ForeignKey("forum_threads.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    thread = relationship("ForumThread", back_populates="replies")
    author = relationship("User", backref="forum_replies")
