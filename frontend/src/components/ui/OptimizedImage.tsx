import { useState, useEffect, useRef, ImgHTMLAttributes } from "react";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  placeholderColor?: string;
  /** Enable lazy loading (default: true) */
  lazy?: boolean;
  /** Blur placeholder while loading */
  blur?: boolean;
}

/**
 * OptimizedImage - Performance-optimized image component
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Placeholder while loading
 * - Error fallback
 * - Smooth fade-in animation
 * - Blur-up effect option
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/placeholder-book.png",
  placeholderColor = "#e5e7eb",
  lazy = true,
  blur = false,
  className = "",
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0.01,
      },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(true);
  };

  const imageSrc = isError ? fallbackSrc : src;

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        backgroundColor: placeholderColor,
        ...style,
      }}
    >
      {/* Placeholder / Loading state */}
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: placeholderColor }}
        />
      )}

      {/* Actual image - only render when in view */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            w-full h-full object-cover
            transition-opacity duration-300
            ${isLoaded ? "opacity-100" : "opacity-0"}
            ${blur && !isLoaded ? "blur-sm scale-105" : ""}
          `}
          loading={lazy ? "lazy" : "eager"}
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images in parallel
 */
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}
