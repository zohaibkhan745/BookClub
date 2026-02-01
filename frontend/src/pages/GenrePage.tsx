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

// Import category background images
import philosophyBg from "../assets/images/Philosophy.webp";
import selfHelpBg from "../assets/images/Self Help.webp";
import fictionBg from "../assets/images/Fiction.webp";
import historyBg from "../assets/images/History.webp";
import biographyBg from "../assets/images/Biography.webp";
import poetryBg from "../assets/images/Poetry.webp";
import nonFictionBg from "../assets/images/Mystery.webp";
import romanceBg from "../assets/images/Romance.webp";
import scienceBg from "../assets/images/Science.webp";
import technologyBg from "../assets/images/Technology.webp";

// Map genre slugs to background images
const genreBackgrounds: Record<string, string> = {
  "self-help": selfHelpBg,
  philosophy: philosophyBg,
  fiction: fictionBg,
  history: historyBg,
  biography: biographyBg,
  poetry: poetryBg,
  "non-fiction": nonFictionBg,
  romance: romanceBg,
  science: scienceBg,
  technology: technologyBg,
};

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

  // Get background image for current genre
  const backgroundImage = genre ? genreBackgrounds[genre] : undefined;

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300 relative">
      {/* Background Image with Overlay */}
      {backgroundImage && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/60 dark:bg-black/75" />
        </div>
      )}

      <div className="relative z-10">
        <Navbar />

        <div className="pt-24 px-4 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center space-x-2 mb-8 transition group ${
              backgroundImage
                ? "text-white/80 hover:text-white"
                : "text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
            }`}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          {/* Page Title */}
          <h1
            className={`text-3xl md:text-4xl font-bold mb-8 ${
              backgroundImage ? "text-white" : "text-black dark:text-white"
            }`}
          >
            {genre ? formatGenreName(genre) : "Books"}
          </h1>

          {/* Content */}
          {isLoading ? (
            <LoadingSpinner
              message={`Loading ${
                genre ? formatGenreName(genre) : ""
              } books...`}
            />
          ) : error ? (
            <ErrorState
              message={error}
              onRetry={loadBooks}
              showHomeLink={false}
            />
          ) : books.length === 0 ? (
            <div className="text-center py-16">
              <p
                className={`text-lg mb-4 ${
                  backgroundImage
                    ? "text-white/80"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
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
                <Link
                  key={book.id}
                  to={`/book/${book.slug || book.id}`}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={book.image}
                      alt={book.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300 bg-gray-200 dark:bg-gray-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white font-semibold text-sm line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-gray-300 text-xs mt-1">
                        {book.author}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <h3
                      className={`font-semibold text-sm line-clamp-1 ${
                        backgroundImage
                          ? "text-white"
                          : "text-gray-800 dark:text-white"
                      }`}
                    >
                      {book.title}
                    </h3>
                    <p
                      className={`text-xs ${
                        backgroundImage
                          ? "text-white/70"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
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
    </div>
  );
}
