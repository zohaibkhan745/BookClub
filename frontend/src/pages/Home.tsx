import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { CategorySection } from "../components/CategorySection";
import { Footer } from "../components/Footer";
import { ErrorState } from "../components/ui/ErrorState";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { OptimizedImage } from "../components/ui/OptimizedImage";
import { useAllBooks } from "../hooks/useBooks";
import type { BookPreview } from "../types";

// Memoized book card component to prevent unnecessary re-renders
const BookCard = memo(function BookCard({
  book,
  onClick,
}: {
  book: BookPreview;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="cursor-pointer group">
      <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
        <OptimizedImage
          src={book.image}
          alt={book.title}
          className="w-full aspect-[2/3]"
          placeholderColor="#d1d5db"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h4 className="text-white font-semibold text-sm line-clamp-2">
            {book.title}
          </h4>
          <p className="text-gray-300 text-xs line-clamp-1">{book.author}</p>
        </div>
      </div>
      <div className="mt-2 px-1">
        <h4 className="text-gray-800 dark:text-gray-200 font-medium text-sm line-clamp-1">
          {book.title}
        </h4>
        <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1">
          {book.author}
        </p>
      </div>
    </div>
  );
});

export function Home() {
  const { books, isLoading, error, refresh } = useAllBooks(50);
  const navigate = useNavigate();

  const handleBookClick = useCallback(
    (slug: string) => {
      navigate(`/book/${slug}`);
    },
    [navigate],
  );

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <div className="pt-20 px-4 md:px-12 pb-8 bg-[rgba(240,255,223,0)]">
        <CategorySection />
      </div>

      <div className="px-4 md:px-12 pb-12 md:pb-12 pb-24">
        {error ? (
          <ErrorState message={error} onRetry={refresh} showHomeLink={false} />
        ) : (
          <div className="space-y-4">
            <h3 className="text-black dark:text-white text-xl md:text-2xl font-semibold">
              All Books
            </h3>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse aspect-[2/3]"
                  />
                ))}
              </div>
            ) : books.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No books available yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onClick={() => handleBookClick(book.slug || book.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
