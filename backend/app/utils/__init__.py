"""
App utilities package.
"""

from app.utils.image_processing import (
    download_image,
    generate_thumbnail,
    get_thumbnail_path,
    get_original_path,
    THUMBNAIL_WIDTH,
    THUMBNAIL_FORMAT,
    THUMBNAIL_QUALITY,
    THUMBNAIL_EXTENSION,
)

from app.utils.storage import (
    get_supabase_client,
    upload_to_storage,
    delete_from_storage,
    get_public_url,
    BUCKET_NAME,
)

__all__ = [
    # Image processing
    "download_image",
    "generate_thumbnail",
    "get_thumbnail_path",
    "get_original_path",
    "THUMBNAIL_WIDTH",
    "THUMBNAIL_FORMAT",
    "THUMBNAIL_QUALITY",
    "THUMBNAIL_EXTENSION",
    # Storage
    "get_supabase_client",
    "upload_to_storage",
    "delete_from_storage",
    "get_public_url",
    "BUCKET_NAME",
]
