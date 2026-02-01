/**
 * Optimized book cover image component with srcset for responsive loading.
 * Uses thumbnails for smaller viewports and full images for larger ones.
 */
import { memo, useState } from "react";

interface BookImageProps {
  /** Thumbnail URL (~250px width, ~10-30KB) */
  thumbnailUrl?: string;
  /** Full image URL */
  fullUrl: string;
  /** Alt text for accessibility */
  alt: string;
  /** CSS class name */
  className?: string;
  /** Image aspect ratio container class */
  containerClassName?: string;
  /** Whether to show a borrowed badge */
  showBorrowedBadge?: boolean;
}

/**
 * Responsive book cover image that loads thumbnails on mobile
 * and full images on desktop for optimal performance.
 */
export const BookImage = memo(function BookImage({
  thumbnailUrl,
  fullUrl,
  alt,
  className = "",
  containerClassName = "",
  showBorrowedBadge = false,
}: BookImageProps) {
  const [hasError, setHasError] = useState(false);

  // Fallback to full URL if thumbnail not available
  const thumbnail = thumbnailUrl || fullUrl;
  const full = fullUrl || thumbnailUrl || "";

  // If both failed, show placeholder
  if (hasError || (!thumbnail && !full)) {
    return (
      <div
        className={`${containerClassName} bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${containerClassName}`}>
      {showBorrowedBadge && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-lg">
          Borrowed
        </div>
      )}
      <img
        src={thumbnail}
        srcSet={
          thumbnail !== full ? `${thumbnail} 250w, ${full} 500w` : undefined
        }
        sizes={
          thumbnail !== full ? "(max-width: 768px) 144px, 192px" : undefined
        }
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className={`${className} bg-gray-200 dark:bg-gray-700`}
      />
    </div>
  );
});

/**
 * Simple optimized image with just lazy loading and error handling
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = "",
  fallbackSrc,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div
        className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}
      >
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className={className}
    />
  );
});
