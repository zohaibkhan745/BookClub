import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { Upload, Plus, LogIn } from "lucide-react";
import { getUserBooks } from "../services";
import { useAuth } from "../context/AuthContext";
import type { BookPreview, ApiError } from "../types";

export function LibraryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [uploadedBooks, setUploadedBooks] = useState<BookPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBooks = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Fetch books uploaded by this user
        const books = await getUserBooks();
        setUploadedBooks(books);
      } catch (err) {
        const apiError = err as ApiError;
        // If unauthorized, just show empty state instead of error
        if (
          apiError.code === "API_ERROR" &&
          apiError.message?.includes("401")
        ) {
          setUploadedBooks([]);
        } else {
          setError(
            apiError.message || "Failed to load your library. Please try again."
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        loadBooks();
      } else {
        setIsLoading(false);
      }
    }
  }, [user, authLoading]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
        <div className="hidden md:block">
          <Navbar />
        </div>
        <header className="md:hidden sticky top-0 z-40 bg-[#F6F0D7]/90 dark:bg-black/90 backdrop-blur-xl px-4 pt-12 pb-4 border-b border-black/10 dark:border-white/10">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Library
          </h1>
        </header>
        <main className="pt-4 md:pt-24 px-4 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto">
          <LoadingSpinner message="Loading..." />
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
        <div className="hidden md:block">
          <Navbar />
        </div>
        <header className="md:hidden sticky top-0 z-40 bg-[#F6F0D7]/90 dark:bg-black/90 backdrop-blur-xl px-4 pt-12 pb-4 border-b border-black/10 dark:border-white/10">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Library
          </h1>
        </header>
        <main className="pt-4 md:pt-24 px-4 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center mb-4">
              <LogIn className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Sign In Required
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              Please sign in to view your library and uploaded books.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition flex items-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          </div>
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      </div>
    );
  }

  // Currently only showing uploaded books (borrowed books feature not implemented in backend)
  const currentBooks = uploadedBooks;

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-[#F6F0D7]/90 dark:bg-black/90 backdrop-blur-xl px-4 pt-12 pb-4 border-b border-black/10 dark:border-white/10">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Library
        </h1>
      </header>

      {/* Main Content */}
      <main className="pt-4 md:pt-24 px-4 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            My Uploads
          </h2>
          <Link
            to="/upload"
            className="px-4 py-2 bg-red-500 text-white font-medium rounded-full hover:bg-red-600 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Book</span>
          </Link>
        </div>

        {/* Content */}
        {isLoading || authLoading ? (
          <LoadingSpinner message="Loading your library..." />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={loadBooks}
            showHomeLink={false}
          />
        ) : currentBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center mb-4">
              <Upload className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              No Uploaded Books Yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              Share your books with the community by uploading them.
            </p>
            <Link
              to="/upload"
              className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Upload Book</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {currentBooks.map((book) => (
              <Link key={book.id} to={`/book/${book.id}`} className="group">
                <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
                  />
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

            {/* Add More Card */}
            <Link
              to="/upload"
              className="flex flex-col items-center justify-center aspect-[2/3] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-500 transition-colors group"
            >
              <Plus className="w-10 h-10 text-gray-400 group-hover:text-red-500 transition-colors" />
              <span className="mt-2 text-sm text-gray-500 dark:text-gray-400 group-hover:text-red-500 transition-colors">
                Upload More
              </span>
            </Link>
          </div>
        )}
      </main>

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
