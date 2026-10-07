"""
Notification models for Book Club.

Supports:
- Broadcast notifications (user_id IS NULL) - visible to all users (e.g. new book uploaded)
- Targeted notifications (user_id IS NOT NULL) - visible to a specific user
- Per-user read tracking via user_notification_reads table
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Notification(Base):
    """
    Notification model for book uploads and community activities.
    
    If user_id is NULL, it is a broadcast notification visible to all users.
    If user_id is set, it is targeted to a specific user.
    """
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=True, index=True)  # NULL = broadcast to all
    actor_id = Column(String(36), nullable=True, index=True)  # User who performed the action (e.g., uploader)
    actor_name = Column(String(255), nullable=True)  # Display name of actor
    type = Column(String(50), nullable=False, default="BOOK_UPLOADED")
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Associated book references
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=True)
    book_slug = Column(String(255), nullable=True)
    book_cover = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    book = relationship("Book", foreign_keys=[book_id])

    __table_args__ = (
        Index("ix_notifications_created_at_desc", created_at.desc()),
    )

    def __repr__(self):
        return f"<Notification(id={self.id}, type='{self.type}', title='{self.title}')>"


class UserNotificationRead(Base):
    """
    Tracks which notifications a user has marked as read.
    Enables broadcast notifications while maintaining individual read status.
    """
    __tablename__ = "user_notification_reads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint("user_id", "notification_id", name="uq_user_notification_read"),
    )

    def __repr__(self):
        return f"<UserNotificationRead(user_id='{self.user_id}', notification_id={self.notification_id})>"
