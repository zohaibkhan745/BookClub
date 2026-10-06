import { useCallback, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { CategorySection } from "../components/CategorySection";
import { ErrorState } from "../components/ui/ErrorState";
import { BookCard } from "../components/BookCard";
import { Button } from "../components/ui/Button";
import { useAllBooks, preloadBook } from "../hooks/useBooks";
import { LazyBookDetailPage } from "../components/LazyPages";
import { apiGet } from "../services/api";
import type { BookPreview } from "../types";

export function Home() {
  const { books, pagination, isLoading, error, refresh, appendBooks } =
    useAllBooks(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleBookHover = useCallback((book: BookPreview) => {
    (LazyBookDetailPage as unknown as { preload?: () => void }).preload?.();
    preloadBook(book.slug || book.id);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!pagination?.next_cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await apiGet<{
        success: boolean;
        data: BookPreview[];
        pagination: {
          next_cursor: number | null;
          has_next: boolean;
          limit: number;
        };
      }>(`/books/all?cursor=${pagination.next_cursor}&limit=50`);
      if (res?.data) {
        appendBooks(res.data, res.pagination);
      }
    } catch (err) {
      console.error("Failed to load more books:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [pagination, isLoadingMore, appendBooks]);

  return (
    <AppLayout>
      {/* Visually hidden primary heading for semantic document hierarchy */}
      <h1 className="sr-only">Book Club — Discover and Share Community Books</h1>

      {/* Category Navigation */}
      <div className="pb-8">
        <CategorySection />
      </div>

      {/* Main Books Grid Section */}
      <div>
        {error ? (
          <ErrorState message={error} onRetry={refresh} showHomeLink={false} />
        ) : (
          <div className="space-y-6">
            <h2 className="text-gray-900 dark:text-white text-xl md:text-2xl font-bold tracking-tight">
              All Books
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse aspect-[2/3]"
                  />
                ))}
              </div>
            ) : books.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                No books available yet.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {books.map((book, index) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      index={index}
                      onHover={() => handleBookHover(book)}
                    />
                  ))}
                </div>
                {pagination?.has_next && (
                  <div className="flex justify-center mt-10">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleLoadMore}
                      isLoading={isLoadingMore}
                    >
                      Load More Books
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
