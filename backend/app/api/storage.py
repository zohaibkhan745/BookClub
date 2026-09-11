"""
Storage API endpoints.
Provides presigned URLs for direct client uploads to Cloudflare R2.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
import time
import uuid

from app.auth import get_current_user, AuthUser
from app.utils import r2_storage

router = APIRouter(prefix="/api/v1/storage", tags=["storage"])


class PresignedUrlRequest(BaseModel):
    contentType: str = Field(default="image/webp", description="MIME type of the image")
    fileName: Optional[str] = Field(default=None, description="Original file name")


@router.post("/upload-url")
async def get_upload_url(
    payload: PresignedUrlRequest = PresignedUrlRequest(),
    user: AuthUser = Depends(get_current_user)
):
    """
    POST /api/v1/storage/upload-url
    Generates presigned PUT URLs for uploading an original image and its thumbnail directly to Cloudflare R2.
    Requires authentication.
    """
    if not r2_storage.is_r2_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "R2_NOT_CONFIGURED",
                "message": "Cloudflare R2 storage is not configured yet. Please configure R2 environment variables."
            }
        )

    timestamp = int(time.time() * 1000)
    unique_id = uuid.uuid4().hex[:8]
    base_name = f"{timestamp}-{unique_id}.webp"

    # Destination paths in R2 bucket
    original_key = f"originals/{user.id}/{base_name}"
    thumbnail_key = f"thumbnails/{user.id}/{base_name}"

    original_presigned = r2_storage.generate_presigned_put_url(
        key=original_key,
        content_type=payload.contentType,
        expires_in=900  # 15 minutes
    )

    thumbnail_presigned = r2_storage.generate_presigned_put_url(
        key=thumbnail_key,
        content_type=payload.contentType,
        expires_in=900
    )

    if not original_presigned or not thumbnail_presigned:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "PRESIGNED_URL_GENERATION_FAILED",
                "message": "Failed to generate presigned upload URLs"
            }
        )

    return {
        "success": True,
        "data": {
            "original": {
                "uploadUrl": original_presigned["upload_url"],
                "publicUrl": original_presigned["public_url"],
                "key": original_presigned["key"]
            },
            "thumbnail": {
                "uploadUrl": thumbnail_presigned["upload_url"],
                "publicUrl": thumbnail_presigned["public_url"],
                "key": thumbnail_presigned["key"]
            }
        }
    }


class DeleteFileRequest(BaseModel):
    key: str = Field(..., description="Object key in R2 bucket to delete")


@router.delete("/file")
async def delete_storage_file(
    payload: DeleteFileRequest,
    user: AuthUser = Depends(get_current_user)
):
    """
    DELETE /api/v1/storage/file
    Deletes an uploaded file from R2 (e.g. if the user cancels an image upload).
    Safety: ensures users can only delete files in their own user directory.
    """
    if not r2_storage.is_r2_configured():
        return {"success": True, "message": "Storage not configured"}

    # Prevent path traversal and enforce strict ownership:
    import posixpath
    clean_key = posixpath.normpath(payload.key).lstrip("/")
    allowed_prefixes = (f"originals/{user.id}/", f"thumbnails/{user.id}/")

    if not clean_key.startswith(allowed_prefixes) or clean_key.startswith(".."):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "You can only delete files within your own user storage path."}
        )

    deleted = r2_storage.delete_file(clean_key)
    return {
        "success": deleted,
        "message": "File deleted" if deleted else "Failed to delete file"
    }
