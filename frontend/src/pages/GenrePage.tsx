import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { getBooksByGenre } from "../services";
import type { BookPreview, ApiError } from "../types";

export function GenrePage() {
  const { genre } = useParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = async () => {
    if (!genre) return;

    setIsLoading(true);
    setError(null);

    try {
      const booksData = await getBooksByGenre(genre);
      setBooks(booksData);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to load books. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [genre]);

  // Format genre name for display (e.g., "science-fiction" -> "Science Fiction")
  const formatGenreName = (genreSlug: string) => {
    return genreSlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <div className="pt-24 px-4 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white mb-8 transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-8">
          {genre ? formatGenreName(genre) : "Books"}
        </h1>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner
            message={`Loading ${genre ? formatGenreName(genre) : ""} books...`}
          />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={loadBooks}
            showHomeLink={false}
          />
        ) : books.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
              No books found in this category yet.
            </p>
            <Link
              to="/upload"
              className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
            >
              Be the first to add one!
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {books.map((book) => (
              <Link key={book.id} to={`/book/${book.id}`} className="group">
                <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-semibold text-sm line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-gray-300 text-xs mt-1">{book.author}</p>
                  </div>
                </div>
                <div className="mt-2 px-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {book.author}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
