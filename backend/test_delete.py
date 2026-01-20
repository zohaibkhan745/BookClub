"""
Quick test script to verify books in database.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set")
    sys.exit(1)

# Fix Render's postgres:// URL if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def list_books():
    """List all books in the database."""
    with Session() as session:
        result = session.execute(text("SELECT id, title, user_id FROM books ORDER BY id"))
        books = result.fetchall()
        print(f"\n=== Books in database ({len(books)} total) ===")
        for book in books:
            print(f"  ID: {book[0]}, Title: '{book[1]}', User: {book[2][:8]}...")
        return books

def delete_book_direct(book_id: int):
    """Directly delete a book from the database to test."""
    with Session() as session:
        # Check if book exists
        result = session.execute(text("SELECT id, title FROM books WHERE id = :id"), {"id": book_id})
        book = result.fetchone()
        
        if not book:
            print(f"\nBook {book_id} not found in database!")
            return False
        
        print(f"\nDeleting book {book_id} ('{book[1]}')...")
        session.execute(text("DELETE FROM books WHERE id = :id"), {"id": book_id})
        session.commit()
        print(f"Book {book_id} deleted successfully!")
        
        # Verify deletion
        result = session.execute(text("SELECT id FROM books WHERE id = :id"), {"id": book_id})
        if result.fetchone():
            print(f"ERROR: Book {book_id} still exists after deletion!")
            return False
        else:
            print(f"Verified: Book {book_id} no longer exists in database.")
            return True

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--delete", type=int, help="Book ID to delete")
    parser.add_argument("--list", action="store_true", help="List all books")
    args = parser.parse_args()
    
    if args.list or not args.delete:
        list_books()
    
    if args.delete:
        delete_book_direct(args.delete)
        list_books()
