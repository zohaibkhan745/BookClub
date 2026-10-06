import { useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { BookDetail } from "../components/BookDetail";
import { AppLayout } from "../components/AppLayout";
import { ErrorState } from "../components/ui/ErrorState";
import { useBook, seedBookCache } from "../hooks/useBooks";
import type { Book, BookPreview } from "../types";

function BookDetailSkeleton() {
  return (
    <div className="w-full">
      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md aspect-[2/3] rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse shadow-md" />
        </div>
        <div className="space-y-6 flex flex-col justify-center">
          <div className="h-12 w-4/5 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="py-4 space-y-2">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          </div>
          <div className="space-y-3">
            <div className="h-5 w-36 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-12 w-full max-w-xs bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    </div>
  );
}

export function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Optimistic preview handoff from previous list view (Home, Search, Genre, Library)
  const preview = (location.state as { preview?: BookPreview })?.preview;

  const fallbackBook: Book | undefined = useMemo(() => {
    if (!preview) return undefined;
    const matches = String(preview.id) === id || preview.slug === id;
    if (!matches && id) return undefined;
    return {
      id: String(preview.id),
      slug: preview.slug || String(preview.id),
      title: preview.title,
      author: preview.author,
      image: preview.image,
      isAvailable: preview.isAvailable ?? true,
      isBorrowed: preview.isBorrowed ?? false,
      genre: (preview as Partial<Book>).genre || "",
      description: (preview as Partial<Book>).description || "",
      year: (preview as Partial<Book>).year || "",
      pages: (preview as Partial<Book>).pages || 0,
      language: (preview as Partial<Book>).language || "English",
      rating: (preview as Partial<Book>).rating || 5,
      listingType: (preview as Partial<Book>).listingType || "lend",
      condition: (preview as Partial<Book>).condition || "good",
      price: (preview as Partial<Book>).price,
      whatsappNumber: (preview as Partial<Book>).whatsappNumber,
      readingJourney: (preview as Partial<Book>).readingJourney || [],
      borrowStatus: (preview as Partial<Book>).borrowStatus,
    };
  }, [preview, id]);

  const { book, isLoading, error, refresh } = useBook(id, fallbackBook);

  // If accessed via numeric ID (e.g. /book/32), cleanly replace URL with title slug
  // Primes SWR cache with seedBookCache before navigation so there is zero reload delay
  useEffect(() => {
    if (book?.slug && id && id !== book.slug) {
      seedBookCache(book);
      navigate(`/book/${book.slug}`, {
        replace: true,
        state: { ...location.state, preview: book },
      });
    }
  }, [book, id, navigate, location.state]);

  if (isLoading && !book) {
    return (
      <AppLayout maxWidth="7xl">
        <BookDetailSkeleton />
      </AppLayout>
    );
  }

  if (error === "BOOK_NOT_FOUND" || (!isLoading && !book)) {
    return (
      <ErrorState
        title="Book not found"
        message="The book you're looking for doesn't exist or has been removed."
        fullScreen
      />
    );
  }

  if (error && !book) {
    return <ErrorState message={error} onRetry={refresh} fullScreen />;
  }

  if (!book) {
    return (
      <ErrorState
        title="Book not found"
        message="The book you're looking for doesn't exist or has been removed."
        fullScreen
      />
    );
  }

  // Handle book update (e.g., when marked as borrowed or returned)
  const handleBookUpdate = (_updatedBook: Book) => {
    refresh();
  };

  return (
    <AppLayout maxWidth="7xl">
      <BookDetail book={book} onBookUpdate={handleBookUpdate} />
    </AppLayout>
  );
}
