import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BookDetail } from "../components/BookDetail";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { getBookById } from "../services";
import type { Book } from "../types";

export function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBook() {
      setIsLoading(true);
      const bookData = await getBookById(Number(id));
      setBook(bookData);
      setIsLoading(false);
    }
    loadBook();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Book not found</h2>
          <a href="/" className="text-red-600 hover:underline">
            Return to home
          </a>
        </div>
      </div>
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
