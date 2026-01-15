import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BookDetail } from "../components/BookDetail";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { getBookById } from "../services";
import type { Book, ApiError } from "../types";

export function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadBook = async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const bookData = await getBookById(Number(id));
      setBook(bookData);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === "BOOK_NOT_FOUND") {
        setNotFound(true);
      } else {
        setError(
          apiError.message || "Failed to load book details. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBook();
  }, [id]);

  if (isLoading) {
    return <LoadingSpinner message="Loading book details..." fullScreen />;
  }

  if (notFound) {
    return (
      <ErrorState
        title="Book not found"
        message="The book you're looking for doesn't exist or has been removed."
        fullScreen
      />
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadBook} fullScreen />;
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

  return (
    <>
      <Navbar />
      <BookDetail book={book} />
      <div className="hidden md:block">
        <Footer />
      </div>
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </>
  );
}
