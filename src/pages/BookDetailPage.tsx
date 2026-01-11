import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BookDetail } from "../components/BookDetail";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { getBookById } from "../services";
import type { Book } from "../types";

export function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBook = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bookData = await getBookById(Number(id));
      setBook(bookData);
    } catch (err) {
      setError("Failed to load book details. Please try again.");
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
      <Footer />
    </>
  );
}
