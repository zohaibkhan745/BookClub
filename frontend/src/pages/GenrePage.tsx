import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "../components/AppLayout";
import { BookCard } from "../components/BookCard";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { useGenreBooks } from "../hooks/useBooks";

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

  // SWR handles caching, dedup, and background revalidation automatically
  const { books, isLoading, error, refresh: loadBooks } = useGenreBooks(genre);

  // Format genre name for display (e.g., "science-fiction" -> "Science Fiction")
  const formatGenreName = (genreSlug: string) => {
    return genreSlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const backgroundImage = genre ? genreBackgrounds[genre] : undefined;

  return (
    <div className="relative min-h-screen">
      {/* Background Image with Dark Readability Overlay */}
      {backgroundImage && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="absolute inset-0 bg-black/65 dark:bg-black/80" />
        </div>
      )}

      <div className="relative z-10">
        <AppLayout transparent={!!backgroundImage}>
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center space-x-2 mb-6 transition group cursor-pointer ${
              backgroundImage
                ? "text-white/80 hover:text-white"
                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            }`}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Back</span>
          </button>

          {/* Page Title */}
          <h1
            className={`text-2xl md:text-4xl font-bold mb-8 tracking-tight ${
              backgroundImage ? "text-white" : "text-gray-900 dark:text-white"
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
                className={`text-lg mb-6 ${
                  backgroundImage
                    ? "text-white/80"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                No books found in this category yet.
              </p>
              <Link
                to="/upload"
                className="inline-block px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition shadow-sm"
              >
                Be the first to add one!
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDarkBg={!!backgroundImage}
                />
              ))}
            </div>
          )}
        </AppLayout>
      </div>
    </div>
  );
}
