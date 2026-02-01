import { useState, useEffect, useCallback, memo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { ErrorState } from "../components/ui/ErrorState";
import { BookOpen, Upload, Plus, LogIn } from "lucide-react";
import { getUserLibrary } from "../services";
import { useAuth } from "../context/AuthContext";
import type { BookPreview, ApiError } from "../types";

// Memoized skeleton loader for instant perceived performance
const BookSkeleton = memo(function BookSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] rounded-xl bg-gray-300 dark:bg-gray-700" />
      <div className="mt-2 px-1">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-1" />
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
      </div>
    </div>
  );
});

// Memoized book card for preventing re-renders
const LibraryBookCard = memo(function LibraryBookCard({
  book,
  showPendingBadge,
}: {
  book: BookPreview;
  showPendingBadge: boolean;
}) {
  return (
    <Link to={`/book/${book.id}`} className="group">
      <div className="relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <img
          src={book.image}
          alt={book.title}
          loading="lazy"
          decoding="async"
          className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300 bg-gray-200 dark:bg-gray-700"
        />
        {/* Notification badge for pending requests */}
        {showPendingBadge &&
          book.pendingRequestCount !== undefined &&
          book.pendingRequestCount > 0 && (
            <div className="absolute top-2 right-2 min-w-[24px] h-6 px-1.5 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <span className="text-white text-xs font-bold">
                {book.pendingRequestCount > 9 ? "9+" : book.pendingRequestCount}
              </span>
            </div>
          )}
      </div>
      <div className="mt-2 px-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-1 flex-1">
            {book.title}
          </h3>
          {/* View Requests indicator */}
          {showPendingBadge &&
            book.pendingRequestCount !== undefined &&
            book.pendingRequestCount > 0 && (
              <span className="ml-1 text-xs text-red-500 font-medium whitespace-nowrap">
                {book.pendingRequestCount}{" "}
                {book.pendingRequestCount === 1 ? "request" : "requests"}
              </span>
            )}
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-xs">
          {book.author}
        </p>
      </div>
    </Link>
  );
});

export function LibraryPage() {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [borrowedBooks, setBorrowedBooks] = useState<BookPreview[]>([]);
  const [uploadedBooks, setUploadedBooks] = useState<BookPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Check if we should show a specific tab (e.g., after deleting a book)
  const initialTab =
    (location.state as { tab?: "borrowed" | "uploaded" })?.tab || "borrowed";
  const [activeTab, setActiveTab] = useState<"borrowed" | "uploaded">(
    initialTab,
  );

  // Load books function - no dependencies on state to avoid infinite loops
  const loadBooks = useCallback(async (forceRefresh = false) => {
    setError(null);
    try {
      const library = await getUserLibrary({ forceRefresh });
      setBorrowedBooks(library.borrowed);
      setUploadedBooks(library.uploaded);
    } catch (err) {
      const apiError = err as ApiError;
      setError(
        apiError.message || "Failed to load your library. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading, then check if authenticated
    if (!authLoading) {
      if (isAuthenticated && !hasFetched.current) {
        hasFetched.current = true;
        loadBooks();
      } else if (!isAuthenticated) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, loadBooks]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadBooks(true);
  }, [loadBooks]);

  const currentBooks = activeTab === "borrowed" ? borrowedBooks : uploadedBooks;

  // Calculate total pending requests across all uploaded books
  const totalPendingRequests = uploadedBooks.reduce(
    (sum, book) => sum + (book.pendingRequestCount || 0),
    0,
  );

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  // Show sign-in required message if not authenticated
  if (!isAuthenticated) {
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

        {/* Sign In Required Message */}
        <main className="pt-4 md:pt-24 px-4 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
              <LogIn className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-3">
              Sign in required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
              Please sign in to view your library and manage your books
            </p>
            <Link
              to="/login"
              state={{ from: "/library" }}
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Link>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />

        {/* Footer - Desktop Only */}
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>
    );
  }

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
        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab("borrowed")}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              activeTab === "borrowed"
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Borrowed Books
          </button>
          <button
            onClick={() => setActiveTab("uploaded")}
            className={`relative px-4 py-2 rounded-full font-medium transition-all ${
              activeTab === "uploaded"
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            My Uploads
            {/* Total pending requests badge */}
            {totalPendingRequests > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                {totalPendingRequests > 99 ? "99+" : totalPendingRequests}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {isLoading && currentBooks.length === 0 ? (
          // Skeleton loading for initial load - instant perceived performance
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <BookSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => loadBooks(true)}
            showHomeLink={false}
          />
        ) : currentBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-[#2c2c2e] flex items-center justify-center mb-4">
              {activeTab === "borrowed" ? (
                <BookOpen className="w-10 h-10 text-gray-400" />
              ) : (
                <Upload className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              {activeTab === "borrowed"
                ? "No Borrowed Books"
                : "No Uploaded Books"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              {activeTab === "borrowed"
                ? "Books you borrow will appear here. Start exploring the Book Store!"
                : "Share your books with the community by uploading them."}
            </p>
            <Link
              to={activeTab === "borrowed" ? "/" : "/upload"}
              className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition flex items-center space-x-2"
            >
              {activeTab === "borrowed" ? (
                <>
                  <BookOpen className="w-5 h-5" />
                  <span>Browse Books</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Upload Book</span>
                </>
              )}
            </Link>
          </div>
        ) : (
          <>
            {/* Background refresh indicator */}
            {isRefreshing && (
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                <span>Refreshing...</span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {currentBooks.map((book) => (
                <LibraryBookCard
                  key={book.id}
                  book={book}
                  showPendingBadge={activeTab === "uploaded"}
                />
              ))}

              {/* Add More Card */}
              <Link
                to={activeTab === "borrowed" ? "/store" : "/upload"}
                className="flex flex-col items-center justify-center aspect-[2/3] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-500 transition-colors group"
              >
                <Plus className="w-10 h-10 text-gray-400 group-hover:text-red-500 transition-colors" />
                <span className="mt-2 text-sm text-gray-500 dark:text-gray-400 group-hover:text-red-500 transition-colors">
                  {activeTab === "borrowed" ? "Borrow More" : "Upload More"}
                </span>
              </Link>
            </div>
          </>
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
