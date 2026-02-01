/**
 * Image Upload Service
 * Handles image compression and upload to Supabase Storage.
 * Uses browser-image-compression for efficient client-side compression.
 */

import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';

/** Allowed image MIME types for input */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

/** Maximum INPUT file size in bytes (20MB) */
const MAX_INPUT_FILE_SIZE = 20 * 1024 * 1024;

/** Maximum OUTPUT file size in bytes (1MB) */
const MAX_OUTPUT_FILE_SIZE = 1 * 1024 * 1024;

/** Maximum width for resizing (original) */
const MAX_WIDTH_PX = 1200;

/** Maximum width for thumbnails (listing pages) */
const THUMBNAIL_WIDTH_PX = 250;

/** Supabase Storage bucket name */
const BUCKET_NAME = 'book-images';

export interface ImageUploadResult {
  url: string;
  path: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
}

export interface ImageUploadError {
  code: string;
  message: string;
}

export interface CompressionResult {
  blob: Blob;
  previewUrl: string;
}

/**
 * Validates the input image file before compression.
 */
function validateInputFile(file: File): ImageUploadError | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      code: 'INVALID_TYPE',
      message: 'Only JPEG, PNG, WebP, GIF, and BMP images are allowed.',
    };
  }

  if (file.size > MAX_INPUT_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `Image must be less than ${MAX_INPUT_FILE_SIZE / (1024 * 1024)}MB.`,
    };
  }

  return null;
}

/**
 * Compresses an image file using browser-image-compression.
 * 
 * - Accepts files up to 20MB
 * - Outputs WebP format
 * - Resizes to max 1200px width
 * - Compresses to under 1MB
 * 
 * @param file - The input image file
 * @returns Compressed blob and preview URL
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  // Validate input file
  const validationError = validateInputFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  const options = {
    maxSizeMB: MAX_OUTPUT_FILE_SIZE / (1024 * 1024), // 1MB
    maxWidthOrHeight: MAX_WIDTH_PX,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.85,
    alwaysKeepResolution: false,
  };

  try {
    // Compress the image
    const compressedBlob = await imageCompression(file, options);

    // Verify output size is under 1MB
    if (compressedBlob.size > MAX_OUTPUT_FILE_SIZE) {
      // If still too large, try again with lower quality
      const fallbackOptions = {
        ...options,
        initialQuality: 0.6,
        maxSizeMB: 0.8, // Target even smaller
      };
      const recompressedBlob = await imageCompression(file, fallbackOptions);
      
      if (recompressedBlob.size > MAX_OUTPUT_FILE_SIZE) {
        throw new Error('Unable to compress image below 1MB. Please use a smaller image.');
      }
      
      return {
        blob: recompressedBlob,
        previewUrl: URL.createObjectURL(recompressedBlob),
      };
    }

    return {
      blob: compressedBlob,
      previewUrl: URL.createObjectURL(compressedBlob),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to compress image. Please try a different file.');
  }
}

/**
 * Compresses an image file to thumbnail size (~250px width).
 * Used for listing pages (Home, Browse, Search) for fast loading.
 * 
 * @param file - The input image file
 * @returns Compressed thumbnail blob
 */
export async function compressThumbnail(file: File): Promise<Blob> {
  // Validate input file
  const validationError = validateInputFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  const options = {
    maxSizeMB: 0.05, // 50KB max for thumbnails
    maxWidthOrHeight: THUMBNAIL_WIDTH_PX,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.8,
    alwaysKeepResolution: false,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return compressedBlob;
  } catch (error) {
    throw new Error('Failed to generate thumbnail.');
  }
}

/**
 * Generates a unique file path for the image in Supabase Storage.
 * Format: books/{userId}/{timestamp}.webp
 */
function generateFilePath(userId: string, prefix: string = 'books'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}/${userId}/${timestamp}-${random}.webp`;
}

/**
 * Uploads a compressed image and its thumbnail to Supabase Storage.
 * 
 * Architecture decision: Generate thumbnails client-side to avoid server load.
 * Both original (1200px) and thumbnail (250px) are uploaded in parallel.
 * 
 * @param file - The original image file (up to 20MB)
 * @param userId - The authenticated user's ID
 * @returns The public URLs of both the original and thumbnail images
 */
export async function uploadBookImage(
  file: File,
  userId: string
): Promise<ImageUploadResult> {
  // Compress both original and thumbnail in parallel
  const [originalResult, thumbnailBlob] = await Promise.all([
    compressImage(file),
    compressThumbnail(file),
  ]);

  // Generate unique file paths
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const baseName = `${timestamp}-${random}`;
  const originalPath = `originals/${userId}/${baseName}.webp`;
  const thumbnailPath = `thumbnails/${userId}/${baseName}.webp`;

  // Upload both images in parallel
  const [originalUpload, thumbnailUpload] = await Promise.all([
    supabase.storage
      .from(BUCKET_NAME)
      .upload(originalPath, originalResult.blob, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year cache for originals
        upsert: false,
      }),
    supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbnailPath, thumbnailBlob, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year cache for thumbnails
        upsert: false,
      }),
  ]);

  if (originalUpload.error) {
    console.error('Failed to upload original:', originalUpload.error);
    throw new Error('Failed to upload image. Please try again.');
  }

  if (thumbnailUpload.error) {
    console.error('Failed to upload thumbnail:', thumbnailUpload.error);
    // Don't fail the whole upload, just log the error
    // Thumbnail can be regenerated later via migration script
  }

  // Get public URLs
  const { data: originalUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(originalPath);

  const { data: thumbnailUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(thumbnailPath);

  if (!originalUrlData?.publicUrl) {
    throw new Error('Failed to get image URL.');
  }

  return {
    url: originalUrlData.publicUrl,
    path: originalPath,
    thumbnailUrl: thumbnailUrlData?.publicUrl,
    thumbnailPath: thumbnailUpload.error ? undefined : thumbnailPath,
  };
}

/**
 * Deletes an image from Supabase Storage.
 */
export async function deleteBookImage(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Failed to delete image:', error);
  }
}

/**
 * Creates a preview URL for an image file (for UI preview before upload).
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a preview URL to free up memory.
 */
export function revokeImagePreview(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
