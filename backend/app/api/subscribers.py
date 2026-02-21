"""
Subscriber API routes for email newsletter subscriptions.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.database import get_db
from app.models.subscriber import Subscriber
from app.schemas.subscriber import SubscribeRequest, SubscribeResponse

router = APIRouter(
    prefix="/api/v1/subscribers",
    tags=["subscribers"],
)


@router.post("/subscribe", response_model=SubscribeResponse)
def subscribe(request: SubscribeRequest, db: Session = Depends(get_db)):
    """
    Subscribe an email address to receive notifications about
    new books and feature updates.
    """
    # Normalise email to lowercase
    email = request.email.lower().strip()

    # Check if already subscribed
    existing = db.query(Subscriber).filter(Subscriber.email == email).first()

    if existing:
        if existing.is_active:
            return SubscribeResponse(
                message="You're already subscribed! We'll keep you posted.",
                email=email,
            )
        # Re-activate a previously unsubscribed email
        existing.is_active = True
        db.commit()
        return SubscribeResponse(
            message="Welcome back! You've been re-subscribed.",
            email=email,
        )

    # Create new subscriber
    try:
        subscriber = Subscriber(email=email, is_active=True)
        db.add(subscriber)
        db.commit()
    except IntegrityError:
        db.rollback()
        return SubscribeResponse(
            message="You're already subscribed! We'll keep you posted.",
            email=email,
        )

    return SubscribeResponse(
        message="Thanks for subscribing! You'll hear from us soon.",
        email=email,
    )
