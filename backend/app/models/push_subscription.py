"""
Push Subscription model for Web Push notifications (iOS PWA & Android).
Stores device push endpoints, encryption keys, and optional user affiliation.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class PushSubscription(Base):
    """
    Push subscription entity for browser Web Push API.
    Enables native device notifications on iOS (Home Screen PWA) and Android.
    """
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    endpoint = Column(Text, nullable=False, unique=True, index=True)
    p256dh = Column(Text, nullable=False)
    auth = Column(Text, nullable=False)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<PushSubscription(id={self.id}, user_id='{self.user_id}', endpoint='{self.endpoint[:30]}...')>"
