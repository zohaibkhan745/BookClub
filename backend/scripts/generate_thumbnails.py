"""
Thumbnail Generation Migration Script

This script generates thumbnails for all existing books that have cover images
but no thumbnails yet. It's designed to be run once after the database
migration to add the cover_image_thumb_url column.

Features:
- Fetches books with cover_image but no cover_image_thumb_url
- Downloads each original image from Supabase Storage
- Generates a ~250px WebP thumbnail
- Uploads thumbnail to thumbnails/books/{bookId}.webp
- Updates the database with the thumbnail URL
- Skips books that already have thumbnails
- Includes detailed logging and error handling
- Supports dry-run mode for testing

Usage:
    # From backend directory
    python -m scripts.generate_thumbnails
    
    # Dry run (no uploads or DB changes)
    python -m scripts.generate_thumbnails --dry-run
    
    # Process specific book IDs
    python -m scripts.generate_thumbnails --book-ids 1,2,3
"""

import os
import sys
import logging
import argparse
from typing import List, Optional
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from sqlalchemy import text
from app.db.database import engine
from app.utils.image_processing import (
    download_image,
    generate_thumbnail,
    get_thumbnail_path,
)
from app.utils.storage import (
    get_supabase_client,
    upload_to_storage,
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('thumbnail_migration.log')
    ]
)
logger = logging.getLogger(__name__)


class ThumbnailMigrator:
    """Handles thumbnail generation for existing books."""
    
    def __init__(self, dry_run: bool = False):
        """
        Initialize the migrator.
        
        Args:
            dry_run: If True, don't make any changes (for testing)
        """
        self.dry_run = dry_run
        self.supabase = get_supabase_client()
        
        self.stats = {
            "processed": 0,
            "success": 0,
            "skipped": 0,
            "failed": 0,
        }
    
    def get_books_needing_thumbnails(self, book_ids: Optional[List[int]] = None) -> List[dict]:
        """
        Fetch all books that have cover_image but no cover_image_thumb_url.
        
        Args:
            book_ids: Optional list of specific book IDs to process
            
        Returns:
            List of book records (id, cover_image)
        """
        with engine.connect() as conn:
            if book_ids:
                # Process specific books
                query = text("""
                    SELECT id, cover_image 
                    FROM books 
                    WHERE id = ANY(:ids)
                    AND cover_image IS NOT NULL 
                    AND cover_image != ''
                """)
                result = conn.execute(query, {"ids": book_ids})
            else:
                # Process all books needing thumbnails
                query = text("""
                    SELECT id, cover_image 
                    FROM books 
                    WHERE cover_image IS NOT NULL 
                    AND cover_image != ''
                    AND (cover_image_thumb_url IS NULL OR cover_image_thumb_url = '')
                    ORDER BY id
                """)
                result = conn.execute(query)
            
            books = [{"id": row[0], "cover_image": row[1]} for row in result]
            
        logger.info(f"Found {len(books)} books needing thumbnails")
        return books
    
    def process_book(self, book_id: int, cover_image_url: str) -> bool:
        """
        Generate and upload thumbnail for a single book.
        
        Args:
            book_id: The book's database ID
            cover_image_url: URL of the original cover image
            
        Returns:
            True if successful, False otherwise
        """
        logger.info(f"Book {book_id}: Processing...")
        
        # Skip non-URL images (like base64)
        if not cover_image_url.startswith(('http://', 'https://')):
            logger.warning(f"Book {book_id}: Skipping non-URL image")
            self.stats["skipped"] += 1
            return False
        
        # Download original image
        logger.info(f"Book {book_id}: Downloading from {cover_image_url[:80]}...")
        image_bytes = download_image(cover_image_url)
        
        if not image_bytes:
            logger.error(f"Book {book_id}: Failed to download image")
            self.stats["failed"] += 1
            return False
        
        logger.info(f"Book {book_id}: Downloaded {len(image_bytes)} bytes")
        
        # Generate thumbnail
        result = generate_thumbnail(image_bytes)
        if not result:
            logger.error(f"Book {book_id}: Failed to generate thumbnail")
            self.stats["failed"] += 1
            return False
        
        thumb_bytes, width, height = result
        logger.info(f"Book {book_id}: Generated thumbnail {width}x{height}, {len(thumb_bytes)} bytes")
        
        if self.dry_run:
            logger.info(f"Book {book_id}: DRY RUN - would upload thumbnail")
            self.stats["success"] += 1
            return True
        
        # Upload thumbnail to Supabase Storage
        if not self.supabase:
            logger.error("Supabase client not configured")
            self.stats["failed"] += 1
            return False
        
        thumb_path = get_thumbnail_path(book_id)
        thumb_url = upload_to_storage(
            self.supabase,
            thumb_bytes,
            thumb_path,
            content_type="image/webp"
        )
        
        if not thumb_url:
            logger.error(f"Book {book_id}: Failed to upload thumbnail")
            self.stats["failed"] += 1
            return False
        
        logger.info(f"Book {book_id}: Uploaded to {thumb_url}")
        
        # Update database
        try:
            with engine.connect() as conn:
                conn.execute(
                    text("UPDATE books SET cover_image_thumb_url = :url WHERE id = :id"),
                    {"url": thumb_url, "id": book_id}
                )
                conn.commit()
            logger.info(f"Book {book_id}: Database updated successfully")
            self.stats["success"] += 1
            return True
        except Exception as e:
            logger.error(f"Book {book_id}: Failed to update database: {e}")
            self.stats["failed"] += 1
            return False
    
    def run(self, book_ids: Optional[List[int]] = None):
        """
        Run the migration for all books needing thumbnails.
        
        Args:
            book_ids: Optional list of specific book IDs to process
        """
        logger.info("=" * 60)
        logger.info("THUMBNAIL GENERATION MIGRATION")
        logger.info(f"Mode: {'DRY RUN' if self.dry_run else 'LIVE'}")
        logger.info("=" * 60)
        
        # Get books to process
        books = self.get_books_needing_thumbnails(book_ids)
        
        if not books:
            logger.info("No books need thumbnail generation")
            return
        
        # Process each book
        for book in books:
            self.stats["processed"] += 1
            self.process_book(book["id"], book["cover_image"])
        
        # Print summary
        logger.info("=" * 60)
        logger.info("MIGRATION COMPLETE")
        logger.info(f"Processed: {self.stats['processed']}")
        logger.info(f"Success:   {self.stats['success']}")
        logger.info(f"Skipped:   {self.stats['skipped']}")
        logger.info(f"Failed:    {self.stats['failed']}")
        logger.info("=" * 60)


def main():
    """Main entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description="Generate thumbnails for existing book cover images"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without making any changes (for testing)"
    )
    parser.add_argument(
        "--book-ids",
        type=str,
        help="Comma-separated list of specific book IDs to process"
    )
    
    args = parser.parse_args()
    
    book_ids = None
    if args.book_ids:
        book_ids = [int(id.strip()) for id in args.book_ids.split(",")]
    
    migrator = ThumbnailMigrator(dry_run=args.dry_run)
    migrator.run(book_ids=book_ids)


if __name__ == "__main__":
    main()
