"""
Subscriber model for email newsletter subscriptions.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class Subscriber(Base):
    """Stores email addresses of users who subscribe to notifications."""

    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Subscriber(email='{self.email}', active={self.is_active})>"
