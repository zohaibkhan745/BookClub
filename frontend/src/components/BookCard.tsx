import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { OptimizedImage } from "./ui/OptimizedImage";
import { preloadBook } from "../hooks/useBooks";
import { LazyBookDetailPage } from "./LazyPages";
import type { BookPreview } from "../types";

export interface BookCardProps {
  book: BookPreview;
  index?: number;
  showPendingBadge?: boolean;
  showBorrowedBadge?: boolean;
  onHover?: () => void;
  onClick?: () => void;
  className?: string;
  onDarkBg?: boolean;
}

export const BookCard = memo(function BookCard({
  book,
  index = 999,
  showPendingBadge = false,
  showBorrowedBadge = true,
  onHover,
  onClick,
  className = "",
  onDarkBg = false,
}: BookCardProps) {
  const location = useLocation();
  const isAboveFold = index < 6;
  const isBorrowed =
    showBorrowedBadge && (book.isBorrowed === true || book.isAvailable === false);
  const hasPendingRequests =
    showPendingBadge &&
    book.pendingRequestCount !== undefined &&
    book.pendingRequestCount > 0;

  const bookUrl = `/book/${book.slug || book.id}`;

  const handleInteraction = () => {
    onHover?.();
    (LazyBookDetailPage as unknown as { preload?: () => void })?.preload?.();
    preloadBook(book.slug || book.id);
  };

  return (
    <Link
      to={bookUrl}
      state={{ from: location.pathname + location.search, preview: book }}
      onClick={onClick}
      onMouseEnter={handleInteraction}
      onFocus={handleInteraction}
      onTouchStart={handleInteraction}
      className={`group block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl transition-transform ${className}`}
      aria-label={`View details for ${book.title} by ${book.author}`}
    >
      <div className="relative overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition-shadow duration-300 bg-gray-200 dark:bg-gray-800">
        <OptimizedImage
          src={book.image}
          alt={book.title}
          className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
          placeholderColor="#d1d5db"
          lazy={!isAboveFold}
          fetchPriority={isAboveFold ? "high" : undefined}
        />

        {/* Hover overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Borrowed Status Badge - WCAG AAA compliant (9:1 contrast ratio) */}
        {isBorrowed && (
          <div className="absolute top-2 right-2 bg-amber-400 text-amber-950 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-md">
            Borrowed
          </div>
        )}

        {/* Pending Requests Badge */}
        {hasPendingRequests && (
          <div className="absolute top-2 right-2 min-w-[24px] h-6 px-1.5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-xs font-bold">
              {book.pendingRequestCount! > 9 ? "9+" : book.pendingRequestCount}
            </span>
          </div>
        )}
      </div>

      {/* Book Metadata */}
      <div className="mt-2.5 px-0.5">
        <div className="flex items-center justify-between gap-1">
          <h3
            className={`font-semibold text-sm line-clamp-1 transition-colors ${
              onDarkBg
                ? "text-white group-hover:text-red-300"
                : "text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400"
            }`}
          >
            {book.title}
          </h3>
          {hasPendingRequests && (
            <span className="text-xs text-red-500 font-medium whitespace-nowrap shrink-0">
              {book.pendingRequestCount}{" "}
              {book.pendingRequestCount === 1 ? "request" : "req"}
            </span>
          )}
        </div>
        <p
          className={`text-xs line-clamp-1 mt-0.5 ${
            onDarkBg ? "text-white/80" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {book.author}
        </p>
      </div>
    </Link>
  );
});

BookCard.displayName = "BookCard";
