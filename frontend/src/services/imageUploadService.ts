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

/** Maximum width for resizing */
const MAX_WIDTH_PX = 1200;

/** Supabase Storage bucket name */
const BUCKET_NAME = 'book-images';

export interface ImageUploadResult {
  url: string;
  path: string;
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
 * Generates a unique file path for the image in Supabase Storage.
 * Format: books/{userId}/{timestamp}.webp
 */
function generateFilePath(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `books/${userId}/${timestamp}-${random}.webp`;
}

/**
 * Uploads a compressed image to Supabase Storage.
 * 
 * @param file - The original image file (up to 20MB)
 * @param userId - The authenticated user's ID
 * @returns The public URL of the uploaded image
 */
export async function uploadBookImage(
  file: File,
  userId: string
): Promise<ImageUploadResult> {
  // Compress image first
  const { blob: compressedBlob } = await compressImage(file);

  // Generate unique file path
  const filePath = generateFilePath(userId);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, compressedBlob, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    throw new Error('Failed to upload image. Please try again.');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get image URL.');
  }

  return {
    url: urlData.publicUrl,
    path: filePath,
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
