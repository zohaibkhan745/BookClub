import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookDetail } from "../components/BookDetail";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { useBook } from "../hooks/useBooks";
import type { Book } from "../types";

export function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { book, isLoading, error, refresh } = useBook(id);

  // If accessed via legacy numeric ID (e.g. /book/32), cleanly replace URL with title slug
  useEffect(() => {
    if (book?.slug && id && id !== book.slug) {
      navigate(`/book/${book.slug}`, { replace: true });
    }
  }, [book?.slug, id, navigate]);

  if (isLoading) {
    return <LoadingSpinner message="Loading book details..." fullScreen />;
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

  if (error) {
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

  // Handle book update (e.g., when marked as borrowed)
  const handleBookUpdate = (updatedBook: Book) => {
    // SWR will automatically revalidate, but we can also trigger refresh
    refresh();
  };

  return (
    <>
      <Navbar />
      <BookDetail book={book} onBookUpdate={handleBookUpdate} />
      <div className="hidden md:block">
        <Footer />
      </div>
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </>
  );
}
