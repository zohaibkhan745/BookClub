/**
 * Image Upload Service
 * Handles image compression and upload to Supabase Storage.
 */

import { supabase } from '../lib/supabase';

/** Allowed image MIME types */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Maximum file size in bytes (1MB) */
const MAX_FILE_SIZE = 1 * 1024 * 1024;

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

/**
 * Validates the image file before upload.
 */
function validateFile(file: File): ImageUploadError | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      code: 'INVALID_TYPE',
      message: 'Only JPEG, PNG, and WebP images are allowed.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: 'Image must be less than 1MB.',
    };
  }

  return null;
}

/**
 * Compresses an image file and returns it as a Blob.
 * Reduces file size while maintaining reasonable quality.
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // Create object URL from file
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generates a unique file path for the image in Supabase Storage.
 * Format: books/{userId}/{timestamp}.jpg
 */
function generateFilePath(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `books/${userId}/${timestamp}-${random}.jpg`;
}

/**
 * Uploads an image to Supabase Storage.
 * 
 * @param file - The image file to upload
 * @param userId - The authenticated user's ID
 * @returns The public URL of the uploaded image
 * @throws Error if upload fails or user is not authenticated
 */
export async function uploadBookImage(
  file: File,
  userId: string
): Promise<ImageUploadResult> {
  // Validate file
  const validationError = validateFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  // Compress image
  let imageBlob: Blob;
  try {
    imageBlob = await compressImage(file);
  } catch {
    throw new Error('Failed to process image. Please try a different file.');
  }

  // Check compressed size
  if (imageBlob.size > MAX_FILE_SIZE) {
    throw new Error('Compressed image is still too large. Please use a smaller image.');
  }

  // Generate unique file path
  const filePath = generateFilePath(userId);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, imageBlob, {
      contentType: 'image/jpeg',
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
 * Used when book creation fails after image upload.
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
