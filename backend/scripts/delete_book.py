"""
Script to safely delete a specific book from the database by title.
Also cleans up associated notifications, borrow records, and invalidates the cache.

Usage:
    python scripts/delete_book.py "A Brief History Of Time"
"""
import sys
import argparse
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.db.database import SessionLocal
from app.models.book import Book
from app.models.borrow_record import BorrowRecord
from app.models.notification import Notification
from app.cache import invalidate_books_cache


def delete_book_by_title(target_title: str, dry_run: bool = False):
    """Find and delete the book with the specified title."""
    db = SessionLocal()
    try:
        print(f"Searching for book with title: '{target_title}'...", flush=True)

        # 1. Search for matching book (case-insensitive)
        matching_books = (
            db.query(Book)
            .filter(Book.title.ilike(target_title.strip()))
            .all()
        )

        if not matching_books:
            # Fallback: substring match in case of minor whitespace/punctuation differences
            print(f"No exact match found for '{target_title}'. Trying partial search...", flush=True)
            matching_books = (
                db.query(Book)
                .filter(Book.title.ilike(f"%{target_title.strip()}%"))
                .all()
            )

        if not matching_books:
            print(f"❌ No book found matching '{target_title}' in the database.", flush=True)
            return False

        print(f"\nFound {len(matching_books)} matching book(s):", flush=True)
        for b in matching_books:
            print(f"  • ID: {b.id} | Title: \"{b.title}\" | Author: \"{b.author}\" | Slug: \"{b.slug}\" | Listed By: \"{b.listed_by}\"", flush=True)

        if len(matching_books) > 1:
            print("\n⚠️ Multiple matches found. Target must uniquely identify 1 book to prevent accidental deletions.", flush=True)
            print("Please specify the exact title or delete by ID.", flush=True)
            return False

        book_to_delete = matching_books[0]

        if dry_run:
            print(f"\n[DRY RUN] Would delete Book ID {book_to_delete.id} ('{book_to_delete.title}'). No changes made.", flush=True)
            return True

        # 2. Delete associated borrow records and notifications (if any)
        deleted_borrows = db.query(BorrowRecord).filter(BorrowRecord.book_id == book_to_delete.id).delete()
        deleted_notifs = db.query(Notification).filter(Notification.book_id == book_to_delete.id).delete()

        # 3. Delete the book record
        db.delete(book_to_delete)
        db.commit()

        # 4. Invalidate book list cache so it disappears immediately from frontend
        invalidate_books_cache()

        print(f"\n✅ Successfully deleted book:", flush=True)
        print(f"   - Title: {book_to_delete.title}")
        print(f"   - ID: {book_to_delete.id}")
        print(f"   - Removed {deleted_borrows} borrow record(s) and {deleted_notifs} notification(s).")
        print("   - Books cache invalidated successfully.", flush=True)
        return True

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error deleting book: {e}", flush=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Delete a specific book from the database.")
    parser.add_argument(
        "title",
        nargs="?",
        default="A Brief History Of Time",
        help="Exact or partial title of the book to delete (default: 'A Brief History Of Time')"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview matching books without deleting"
    )
    args = parser.parse_args()

    delete_book_by_title(args.title, dry_run=args.dry_run)
