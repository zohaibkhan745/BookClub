"""
Cloudflare R2 Storage Utilities

Provides S3-compatible utilities for Cloudflare R2:
- Generating presigned upload URLs (for direct browser PUT)
- Generating public CDN URLs
- Uploading bytes (for server-side migration)
- Deleting files
"""

import os
import logging
from typing import Optional, Dict, Any
from botocore.config import Config
import boto3
from app.config import get_settings

logger = logging.getLogger(__name__)


def is_r2_configured() -> bool:
    """Check if required R2 credentials are set."""
    settings = get_settings()
    return bool(
        settings.r2_account_id
        and settings.r2_access_key_id
        and settings.r2_secret_access_key
    )


def get_r2_client():
    """
    Get configured boto3 S3 client for Cloudflare R2.
    Returns None if credentials are not configured.
    """
    if not is_r2_configured():
        logger.warning("Cloudflare R2 credentials are not fully configured")
        return None

    settings = get_settings()
    endpoint_url = f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 3, "mode": "standard"},
        ),
    )


def get_public_url(key: str) -> str:
    """
    Get the public CDN URL for a given object key in R2.
    Uses R2_PUBLIC_DOMAIN from settings (e.g. https://pub-xxxx.r2.dev or custom CDN domain).
    """
    settings = get_settings()
    clean_key = key.lstrip("/")
    
    if settings.r2_public_domain:
        domain = settings.r2_public_domain.rstrip("/")
        return f"{domain}/{clean_key}"
    
    # Fallback if domain not set: standard r2.cloudflarestorage.com path
    return f"https://{settings.r2_account_id}.r2.cloudflarestorage.com/{settings.r2_bucket_name}/{clean_key}"


def generate_presigned_put_url(
    key: str,
    content_type: str = "image/webp",
    expires_in: int = 900  # 15 minutes
) -> Optional[Dict[str, str]]:
    """
    Generate a presigned PUT URL for browser direct upload to Cloudflare R2.

    Args:
        key: The destination path in R2 (e.g. 'originals/books/user123/img.webp')
        content_type: MIME type of the file (defaults to image/webp)
        expires_in: Expiration time in seconds

    Returns:
        Dict with 'upload_url', 'public_url', and 'key', or None on failure
    """
    client = get_r2_client()
    if not client:
        return None

    settings = get_settings()
    clean_key = key.lstrip("/")

    try:
        upload_url = client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": settings.r2_bucket_name,
                "Key": clean_key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )

        return {
            "upload_url": upload_url,
            "public_url": get_public_url(clean_key),
            "key": clean_key,
        }
    except Exception as e:
        logger.error(f"Failed to generate presigned URL for key {clean_key}: {e}")
        return None


def upload_file_bytes(
    key: str,
    data: bytes,
    content_type: str = "image/webp",
    cache_control: str = "public, max-age=31536000, immutable"
) -> Optional[str]:
    """
    Upload file bytes directly to R2 (used during migrations / background processing).

    Args:
        key: Storage key/path in the bucket
        data: File content as bytes
        content_type: MIME type
        cache_control: Cache-Control header

    Returns:
        Public URL if upload succeeded, None otherwise
    """
    client = get_r2_client()
    if not client:
        return None

    settings = get_settings()
    clean_key = key.lstrip("/")

    try:
        client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=clean_key,
            Body=data,
            ContentType=content_type,
            CacheControl=cache_control,
        )
        return get_public_url(clean_key)
    except Exception as e:
        logger.error(f"Failed to upload bytes to R2 for key {clean_key}: {e}")
        return None


def delete_file(key: str) -> bool:
    """
    Delete a file from R2.

    Args:
        key: Storage key/path in bucket

    Returns:
        True if deleted or nonexistent, False on error
    """
    client = get_r2_client()
    if not client:
        return False

    settings = get_settings()
    clean_key = key.lstrip("/")

    try:
        client.delete_object(
            Bucket=settings.r2_bucket_name,
            Key=clean_key,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to delete {clean_key} from R2: {e}")
        return False
