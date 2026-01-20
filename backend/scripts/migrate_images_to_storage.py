"""
One-time Migration Script: Base64 Images to Supabase Storage

This script migrates book cover images from base64 strings stored in the database
to Supabase Storage, replacing them with public URLs.

Usage:
    cd backend
    .\.venv\Scripts\Activate.ps1
    pip install supabase  # If not already installed
    python scripts/migrate_images_to_storage.py

The script is idempotent - safe to re-run. It will skip:
- Books with NULL cover_image
- Books already containing URLs (not base64)
- Books that fail to migrate (logged but don't crash)
"""

import os
import sys
import base64
import re
import logging
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# ============================================
# Configuration
# ============================================

DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Use service key for admin access

BUCKET_NAME = "book-images"
STORAGE_PATH_PREFIX = "migrated/books"

# ============================================
# Logging Setup
# ============================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f"migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    ]
)
logger = logging.getLogger(__name__)

# ============================================
# Helper Functions
# ============================================

def parse_base64_image(base64_string: str) -> tuple[bytes, str] | None:
    """
    Parse a base64 data URL and extract image bytes and extension.
    
    Args:
        base64_string: Base64 encoded image string (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
    
    Returns:
        Tuple of (image_bytes, extension) or None if parsing fails
    """
    # Match data URL pattern: data:image/{type};base64,{data}
    pattern = r'^data:image/(jpeg|png|webp|jpg);base64,(.+)$'
    match = re.match(pattern, base64_string, re.IGNORECASE)
    
    if not match:
        return None
    
    image_type = match.group(1).lower()
    base64_data = match.group(2)
    
    # Normalize extension
    extension = "jpg" if image_type in ("jpeg", "jpg") else image_type
    
    try:
        image_bytes = base64.b64decode(base64_data)
        return (image_bytes, extension)
    except Exception as e:
        logger.error(f"Failed to decode base64: {e}")
        return None


def get_content_type(extension: str) -> str:
    """Get MIME content type from file extension."""
    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
    }
    return content_types.get(extension, "image/jpeg")


def is_url(value: str) -> bool:
    """Check if the value is already a URL (not base64)."""
    if not value:
        return False
    return value.startswith("http://") or value.startswith("https://")


def is_base64_image(value: str) -> bool:
    """Check if the value is a base64 encoded image."""
    if not value:
        return False
    return value.startswith("data:image")


# ============================================
# Migration Functions
# ============================================

def upload_to_supabase(
    supabase: Client,
    image_bytes: bytes,
    book_id: int,
    extension: str
) -> str | None:
    """
    Upload image bytes to Supabase Storage.
    
    Args:
        supabase: Supabase client
        image_bytes: Raw image bytes
        book_id: Book ID for file naming
        extension: File extension (jpg, png, webp)
    
    Returns:
        Public URL of uploaded image, or None on failure
    """
    file_path = f"{STORAGE_PATH_PREFIX}/{book_id}.{extension}"
    content_type = get_content_type(extension)
    
    try:
        # Upload to Supabase Storage
        # Using upsert=True to allow re-running (overwrites existing file)
        result = supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=image_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "true"  # Allow overwriting
            }
        )
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
        
        return public_url
        
    except Exception as e:
        logger.error(f"Failed to upload book {book_id} to Supabase: {e}")
        return None


def migrate_book(
    session,
    supabase: Client,
    book_id: int,
    cover_image: str
) -> bool:
    """
    Migrate a single book's cover image to Supabase Storage.
    
    Args:
        session: SQLAlchemy session
        supabase: Supabase client
        book_id: Book ID
        cover_image: Base64 encoded image string
    
    Returns:
        True if migration successful, False otherwise
    """
    # Skip if already a URL
    if is_url(cover_image):
        logger.info(f"Book {book_id}: Already a URL, skipping")
        return True
    
    # Skip if not a valid base64 image
    if not is_base64_image(cover_image):
        logger.warning(f"Book {book_id}: Invalid format (not base64 image), skipping")
        return False
    
    # Parse base64 image
    parsed = parse_base64_image(cover_image)
    if not parsed:
        logger.error(f"Book {book_id}: Failed to parse base64 image")
        return False
    
    image_bytes, extension = parsed
    logger.info(f"Book {book_id}: Parsed {len(image_bytes)} bytes as {extension}")
    
    # Upload to Supabase Storage
    public_url = upload_to_supabase(supabase, image_bytes, book_id, extension)
    if not public_url:
        logger.error(f"Book {book_id}: Upload failed")
        return False
    
    # Update database with public URL
    try:
        session.execute(
            text("UPDATE books SET cover_image = :url, updated_at = NOW() WHERE id = :id"),
            {"url": public_url, "id": book_id}
        )
        session.commit()
        logger.info(f"Book {book_id}: ✓ Migrated successfully -> {public_url}")
        return True
    except Exception as e:
        session.rollback()
        logger.error(f"Book {book_id}: Database update failed: {e}")
        return False


def run_migration():
    """
    Main migration function.
    Fetches all books with base64 images and migrates them to Supabase Storage.
    """
    # Validate environment variables
    if not DATABASE_URL:
        logger.error("DATABASE_URL environment variable is not set")
        sys.exit(1)
    
    if not SUPABASE_URL:
        logger.error("SUPABASE_URL environment variable is not set")
        sys.exit(1)
    
    if not SUPABASE_SERVICE_KEY:
        logger.error("SUPABASE_SERVICE_KEY environment variable is not set")
        logger.error("Add SUPABASE_SERVICE_KEY to your .env file (get it from Supabase Dashboard > Settings > API)")
        sys.exit(1)
    
    logger.info("=" * 60)
    logger.info("Starting Image Migration: Base64 -> Supabase Storage")
    logger.info("=" * 60)
    logger.info(f"Database: {DATABASE_URL[:50]}...")
    logger.info(f"Supabase: {SUPABASE_URL}")
    logger.info(f"Bucket: {BUCKET_NAME}")
    logger.info(f"Path prefix: {STORAGE_PATH_PREFIX}")
    logger.info("=" * 60)
    
    # Initialize Supabase client with service key (admin access)
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Initialize database connection
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Fetch all books with base64 cover images
        # We select books where cover_image starts with 'data:image'
        result = session.execute(
            text("""
                SELECT id, cover_image 
                FROM books 
                WHERE cover_image IS NOT NULL 
                  AND cover_image LIKE 'data:image%'
                ORDER BY id
            """)
        )
        books = result.fetchall()
        
        total = len(books)
        logger.info(f"Found {total} books with base64 images to migrate")
        
        if total == 0:
            logger.info("No books to migrate. Migration complete!")
            return
        
        # Migration counters
        success_count = 0
        skip_count = 0
        error_count = 0
        
        # Process each book
        for i, (book_id, cover_image) in enumerate(books, 1):
            logger.info(f"[{i}/{total}] Processing book {book_id}...")
            
            try:
                if migrate_book(session, supabase, book_id, cover_image):
                    if is_url(cover_image):
                        skip_count += 1
                    else:
                        success_count += 1
                else:
                    error_count += 1
            except Exception as e:
                logger.error(f"Book {book_id}: Unexpected error: {e}")
                error_count += 1
                session.rollback()
        
        # Summary
        logger.info("=" * 60)
        logger.info("Migration Complete!")
        logger.info("=" * 60)
        logger.info(f"Total processed: {total}")
        logger.info(f"✓ Successfully migrated: {success_count}")
        logger.info(f"→ Already URLs (skipped): {skip_count}")
        logger.info(f"✗ Errors: {error_count}")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Migration failed with error: {e}")
        session.rollback()
        raise
    finally:
        session.close()


# ============================================
# Entry Point
# ============================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("Book Club - Image Migration Script")
    print("Base64 -> Supabase Storage")
    print("=" * 60 + "\n")
    
    # Confirm before running
    confirm = input("This will migrate all base64 images to Supabase Storage.\nContinue? (y/N): ")
    if confirm.lower() != 'y':
        print("Migration cancelled.")
        sys.exit(0)
    
    print()
    run_migration()
