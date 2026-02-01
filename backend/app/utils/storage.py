"""
Supabase Storage Utilities

This module provides utilities for interacting with Supabase Storage:
- Uploading images (originals and thumbnails)
- Generating public URLs
- Deleting images

Separates storage operations from image processing logic.
"""

import os
import logging
from typing import Optional
from supabase import create_client, Client

# Configure logging
logger = logging.getLogger(__name__)

# Storage configuration
BUCKET_NAME = "book-images"


def get_supabase_client() -> Optional[Client]:
    """
    Get a configured Supabase client.
    
    Returns:
        Supabase Client if credentials are configured, None otherwise
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        logger.warning("Supabase credentials not configured")
        return None
    
    return create_client(supabase_url, supabase_key)


def upload_to_storage(
    supabase: Client,
    file_bytes: bytes,
    file_path: str,
    content_type: str = "image/webp"
) -> Optional[str]:
    """
    Upload a file to Supabase Storage.
    
    Args:
        supabase: Supabase client instance
        file_bytes: File content as bytes
        file_path: Path within the bucket (e.g., 'thumbnails/books/123.webp')
        content_type: MIME type of the file
        
    Returns:
        Public URL of the uploaded file, or None on failure
    """
    try:
        # Check if file already exists and remove it (upsert behavior)
        try:
            supabase.storage.from_(BUCKET_NAME).remove([file_path])
        except Exception:
            pass  # File might not exist, that's fine
        
        # Upload the file
        result = supabase.storage.from_(BUCKET_NAME).upload(
            file_path,
            file_bytes,
            file_options={
                "content-type": content_type,
                "cache-control": "31536000",  # 1 year cache
                "upsert": "true"
            }
        )
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
        
        logger.info(f"Uploaded file to {file_path}, URL: {public_url}")
        return public_url
        
    except Exception as e:
        logger.error(f"Failed to upload file to {file_path}: {e}")
        return None


def delete_from_storage(supabase: Client, file_path: str) -> bool:
    """
    Delete a file from Supabase Storage.
    
    Args:
        supabase: Supabase client instance
        file_path: Path within the bucket
        
    Returns:
        True if deleted successfully, False otherwise
    """
    try:
        supabase.storage.from_(BUCKET_NAME).remove([file_path])
        logger.info(f"Deleted file: {file_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete file {file_path}: {e}")
        return False


def get_public_url(supabase: Client, file_path: str) -> str:
    """
    Get the public URL for a file in storage.
    
    Args:
        supabase: Supabase client instance
        file_path: Path within the bucket
        
    Returns:
        Public URL of the file
    """
    return supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
