"""
Script to backfill and clean up slugs for all existing books in the database.
Computes clean unique title slugs in memory and applies in a single transaction.
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.db.database import SessionLocal
from app.models.book import Book
from app.utils.slug import slugify
from app.cache import invalidate_books_cache


def backfill_slugs():
    db = SessionLocal()
    try:
        books = db.query(Book).order_by(Book.id.asc()).all()
        print(f"Found {len(books)} books to process...", flush=True)
        
        assigned_slugs = set()
        updated_count = 0
        
        for book in books:
            base_slug = slugify(book.title)
            candidate = base_slug
            counter = 2
            while candidate in assigned_slugs:
                candidate = f"{base_slug}-{counter}"
                counter += 1
            
            assigned_slugs.add(candidate)
            if book.slug != candidate:
                book.slug = candidate
                updated_count += 1
        
        db.commit()
        invalidate_books_cache()
        print(f"Successfully updated {updated_count} books with clean slugs!\n", flush=True)
        for b in books:
            print(f"[{b.id}] -> {b.slug}", flush=True)
    except Exception as e:
        db.rollback()
        print(f"Error backfilling slugs: {e}", flush=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    backfill_slugs()
