"""
Script to sync credits for all users based on their uploaded books.
Credit formula: 1 (signup bonus) + number of books uploaded
"""
from app.db.database import SessionLocal
from app.models import User, Book
from sqlalchemy import func

def sync_credits():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        updated = []
        
        for user in users:
            # Count books uploaded by this user
            books_count = db.query(func.count(Book.id)).filter(
                Book.user_id == user.id
            ).scalar() or 0
            
            # Calculate correct credits: 1 (signup) + books uploaded
            correct_credits = 1 + books_count
            
            # Only update if different
            if user.credits != correct_credits:
                old = user.credits or 0
                user.credits = correct_credits
                updated.append({
                    "username": user.username,
                    "old": old,
                    "new": correct_credits,
                    "books": books_count
                })
        
        db.commit()
        
        print(f"Updated {len(updated)} users:")
        for u in updated:
            print(f"  {u['username']}: {u['old']} -> {u['new']} ({u['books']} books)")
        
        if not updated:
            print("All users already have correct credits!")
            
    finally:
        db.close()

if __name__ == "__main__":
    sync_credits()
