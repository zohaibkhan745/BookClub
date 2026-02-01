"""
Image Processing Utilities for Thumbnail Generation

This module provides utilities for:
- Downloading images from URLs
- Generating optimized WebP thumbnails
- Uploading to Supabase Storage

Architecture:
- Separates image processing from storage and database operations
- Uses Pillow for high-quality resizing with LANCZOS resampling
- Outputs WebP format for optimal compression (~10-20KB per thumbnail)
"""

import io
import logging
from typing import Optional, Tuple
from PIL import Image
import httpx

# Configure logging
logger = logging.getLogger(__name__)

# Thumbnail configuration
THUMBNAIL_WIDTH = 250  # Target width in pixels
THUMBNAIL_FORMAT = "WEBP"
THUMBNAIL_QUALITY = 85  # WebP quality (0-100)
THUMBNAIL_EXTENSION = "webp"


def download_image(url: str, timeout: float = 30.0) -> Optional[bytes]:
    """
    Download an image from a URL.
    
    Args:
        url: The image URL to download
        timeout: Request timeout in seconds
        
    Returns:
        Image bytes if successful, None otherwise
    """
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(url)
            response.raise_for_status()
            return response.content
    except httpx.HTTPError as e:
        logger.error(f"Failed to download image from {url}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error downloading image: {e}")
        return None


def generate_thumbnail(
    image_bytes: bytes,
    target_width: int = THUMBNAIL_WIDTH,
    quality: int = THUMBNAIL_QUALITY
) -> Optional[Tuple[bytes, int, int]]:
    """
    Generate a WebP thumbnail from image bytes.
    
    Uses LANCZOS resampling for high-quality downscaling.
    Maintains aspect ratio based on target width.
    
    Args:
        image_bytes: Raw image bytes (any format Pillow supports)
        target_width: Target width in pixels (height auto-calculated)
        quality: WebP quality (0-100)
        
    Returns:
        Tuple of (thumbnail_bytes, width, height) if successful, None otherwise
    """
    try:
        # Open image from bytes
        with Image.open(io.BytesIO(image_bytes)) as img:
            # Convert to RGB if necessary (for PNG with alpha, etc.)
            if img.mode in ('RGBA', 'P', 'LA'):
                # Create white background for transparent images
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calculate new dimensions maintaining aspect ratio
            original_width, original_height = img.size
            
            # Only resize if image is larger than target
            if original_width <= target_width:
                new_width = original_width
                new_height = original_height
            else:
                aspect_ratio = original_height / original_width
                new_width = target_width
                new_height = int(target_width * aspect_ratio)
            
            # Resize with high-quality resampling
            if (new_width, new_height) != (original_width, original_height):
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save as WebP
            output = io.BytesIO()
            img.save(output, format=THUMBNAIL_FORMAT, quality=quality, optimize=True)
            thumbnail_bytes = output.getvalue()
            
            logger.debug(
                f"Generated thumbnail: {original_width}x{original_height} -> "
                f"{new_width}x{new_height}, size: {len(thumbnail_bytes)} bytes"
            )
            
            return thumbnail_bytes, new_width, new_height
            
    except Exception as e:
        logger.error(f"Failed to generate thumbnail: {e}")
        return None


def get_thumbnail_path(book_id: int) -> str:
    """
    Generate the storage path for a book's thumbnail.
    
    Args:
        book_id: The book's database ID
        
    Returns:
        Storage path like 'thumbnails/books/123.webp'
    """
    return f"thumbnails/books/{book_id}.{THUMBNAIL_EXTENSION}"


def get_original_path(book_id: int, extension: str = "jpg") -> str:
    """
    Generate the storage path for a book's original image.
    
    Args:
        book_id: The book's database ID
        extension: Image file extension
        
    Returns:
        Storage path like 'originals/books/123.jpg'
    """
    return f"originals/books/{book_id}.{extension}"
