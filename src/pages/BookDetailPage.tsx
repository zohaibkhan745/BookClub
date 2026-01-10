import { useParams } from "react-router-dom";
import { BookDetail } from "../components/BookDetail";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { booksData } from "../data";

export function BookDetailPage() {
  const { id } = useParams();
  const book = booksData[Number(id)];

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
