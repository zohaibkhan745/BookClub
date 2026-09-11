"""
Migration Script: Migrate Book Cover Images and Thumbnails from Supabase Storage to Cloudflare R2

Usage:
    # 1. Test in dry-run mode first (does not modify DB or upload):
    python scripts/migrate_supabase_to_r2.py --dry-run

    # 2. Test a single book ID:
    python scripts/migrate_supabase_to_r2.py --book-id 12

    # 3. Test on first 5 books:
    python scripts/migrate_supabase_to_r2.py --limit 5

    # 4. Run full migration:
    python scripts/migrate_supabase_to_r2.py

Features:
- Downloads image from existing URL (Supabase Storage or any HTTP URL)
- Uploads directly to Cloudflare R2 bucket (books-images)
- If thumbnail is missing, automatically generates high-quality ~250px WebP thumbnail
- Updates database row with new Cloudflare R2 public URLs
- Completely idempotent: skips already migrated books
- Safe: leaves Supabase Storage intact during migration
"""

import os
import sys
import logging
import argparse
import io
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple
import httpx
from PIL import Image

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

from app.config import get_settings
from app.utils import r2_storage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f"r2_migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("r2_migrator")


def download_image_bytes(url: str, timeout: float = 30.0) -> Optional[bytes]:
    """Download image bytes from any HTTP/HTTPS URL."""
    try:
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            resp = client.get(url)
            resp.raise_for_status()
            return resp.content
    except Exception as e:
        logger.error(f"Failed to download image from {url}: {e}")
        return None


def generate_webp_thumbnail(image_bytes: bytes, target_width: int = 250) -> Optional[bytes]:
    """Generate ~250px WebP thumbnail from image bytes."""
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            if img.mode in ("RGBA", "P", "LA"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                bg.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                img = bg
            elif img.mode != "RGB":
                img = img.convert("RGB")

            width, height = img.size
            if width > target_width:
                aspect = height / width
                new_width = target_width
                new_height = int(target_width * aspect)
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            output = io.BytesIO()
            img.save(output, format="WEBP", quality=85, optimize=True)
            return output.getvalue()
    except Exception as e:
        logger.error(f"Failed to generate thumbnail: {e}")
        return None


def run_migration(dry_run: bool = False, limit: Optional[int] = None, book_id: Optional[int] = None):
    settings = get_settings()

    if not dry_run and not r2_storage.is_r2_configured():
        logger.error("Cloudflare R2 credentials are not configured in .env! Please configure R2 settings first.")
        sys.exit(1)

    database_url = settings.database_url
    if not database_url or "sqlite" in database_url:
        logger.warning(f"Using database URL: {database_url}")

    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    public_domain = (settings.r2_public_domain or "").rstrip("/")

    try:
        # Build query
        query_str = "SELECT id, title, cover_image, cover_image_thumb_url FROM books WHERE cover_image IS NOT NULL"
        params = {}

        if book_id is not None:
            query_str += " AND id = :book_id"
            params["book_id"] = book_id

        query_str += " ORDER BY id ASC"

        if limit is not None:
            query_str += f" LIMIT {limit}"

        books = session.execute(text(query_str), params).fetchall()
        logger.info(f"Found {len(books)} book(s) to inspect.")

        stats = {
            "total": len(books),
            "skipped_already_migrated": 0,
            "migrated": 0,
            "failed": 0,
        }

        for book in books:
            b_id = book.id
            b_title = book.title
            cover_url = book.cover_image or ""
            thumb_url = book.cover_image_thumb_url or ""

            # Check if already pointing to R2
            is_cover_r2 = public_domain and public_domain in cover_url
            is_thumb_r2 = public_domain and (not thumb_url or public_domain in thumb_url)

            if is_cover_r2 and is_thumb_r2:
                logger.info(f"[Book {b_id}] '{b_title}' already on Cloudflare R2. Skipping.")
                stats["skipped_already_migrated"] += 1
                continue

            logger.info(f"[Book {b_id}] Processing '{b_title}'...")

            new_cover_url = cover_url
            new_thumb_url = thumb_url

            # 1. Migrate original cover
            cover_bytes = None
            if cover_url and (not public_domain or public_domain not in cover_url):
                if cover_url.startswith("http"):
                    cover_bytes = download_image_bytes(cover_url)
                    if cover_bytes:
                        key = f"originals/books/{b_id}.webp"
                        if not dry_run:
                            new_cover_url = r2_storage.upload_file_bytes(
                                key=key,
                                data=cover_bytes,
                                content_type="image/webp"
                            )
                        else:
                            new_cover_url = f"{public_domain or 'https://pub-r2.dev'}/{key}"
                    else:
                        logger.warning(f"[Book {b_id}] Could not download cover from {cover_url}")
                        stats["failed"] += 1
                        continue

            # 2. Migrate thumbnail (or generate one if missing)
            if thumb_url and (not public_domain or public_domain not in thumb_url):
                if thumb_url.startswith("http"):
                    thumb_bytes = download_image_bytes(thumb_url)
                    if thumb_bytes:
                        key = f"thumbnails/books/{b_id}.webp"
                        if not dry_run:
                            new_thumb_url = r2_storage.upload_file_bytes(
                                key=key,
                                data=thumb_bytes,
                                content_type="image/webp"
                            )
                        else:
                            new_thumb_url = f"{public_domain or 'https://pub-r2.dev'}/{key}"
            elif not thumb_url and cover_bytes:
                # Generate thumbnail from cover
                generated_thumb_bytes = generate_webp_thumbnail(cover_bytes)
                if generated_thumb_bytes:
                    key = f"thumbnails/books/{b_id}.webp"
                    if not dry_run:
                        new_thumb_url = r2_storage.upload_file_bytes(
                            key=key,
                            data=generated_thumb_bytes,
                            content_type="image/webp"
                        )
                    else:
                        new_thumb_url = f"{public_domain or 'https://pub-r2.dev'}/{key}"

            # 3. Update database
            if not dry_run:
                session.execute(
                    text("""
                        UPDATE books 
                        SET cover_image = :new_cover, 
                            cover_image_thumb_url = :new_thumb,
                            updated_at = NOW() 
                        WHERE id = :book_id
                    """),
                    {
                        "new_cover": new_cover_url,
                        "new_thumb": new_thumb_url,
                        "book_id": b_id,
                    }
                )
                session.commit()
                logger.info(f"[Book {b_id}] Successfully migrated to R2!\n  Cover: {new_cover_url}\n  Thumb: {new_thumb_url}")
            else:
                logger.info(f"[DRY-RUN] [Book {b_id}] Would update DB to:\n  Cover: {new_cover_url}\n  Thumb: {new_thumb_url}")

            stats["migrated"] += 1

        print("\n================== MIGRATION SUMMARY ==================")
        print(f"Mode: {'DRY RUN (No changes saved)' if dry_run else 'LIVE MIGRATION'}")
        print(f"Total books inspected:      {stats['total']}")
        print(f"Already on R2 (skipped):    {stats['skipped_already_migrated']}")
        print(f"Successfully migrated:     {stats['migrated']}")
        print(f"Failed to download/upload: {stats['failed']}")
        print("=======================================================\n")

    except Exception as e:
        session.rollback()
        logger.error(f"Migration aborted due to error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate book images to Cloudflare R2")
    parser.add_argument("--dry-run", action="store_true", help="Simulate migration without modifying DB or R2")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of books to process")
    parser.add_argument("--book-id", type=int, default=None, help="Process a single book ID")
    args = parser.parse_args()

    run_migration(dry_run=args.dry_run, limit=args.limit, book_id=args.book_id)
