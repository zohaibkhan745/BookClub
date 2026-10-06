import { useState, useEffect, useCallback, memo, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { BookCard } from "../components/BookCard";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { BookOpen, Upload, Plus, LogIn, Loader2 } from "lucide-react";
import { getUserLibrary } from "../services";
import { useAuth } from "../context/AuthContext";
import type { BookPreview, ApiError } from "../types";

// Memoized skeleton loader for instant perceived performance
const BookSkeleton = memo(function BookSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] rounded-xl bg-gray-300 dark:bg-gray-800" />
      <div className="mt-2.5 px-0.5">
        <div className="h-4 bg-gray-300 dark:bg-gray-800 rounded w-3/4 mb-1.5" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );
});

export function LibraryPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [borrowedBooks, setBorrowedBooks] = useState<BookPreview[]>([]);
  const [uploadedBooks, setUploadedBooks] = useState<BookPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Check URL query parameter first (?tab=uploaded), then location.state, fallback to "borrowed"
  const queryTab = searchParams.get("tab") as "borrowed" | "uploaded" | null;
  const stateTab = (location.state as { tab?: "borrowed" | "uploaded" })?.tab;

  const [activeTab, setActiveTab] = useState<"borrowed" | "uploaded">(() => {
    if (queryTab === "uploaded" || queryTab === "borrowed") return queryTab;
    if (stateTab === "uploaded" || stateTab === "borrowed") return stateTab;
    return "borrowed";
  });

  // Keep activeTab in sync with URL search params (e.g. back/forward navigation)
  useEffect(() => {
    if (queryTab === "uploaded" || queryTab === "borrowed") {
      setActiveTab(queryTab);
    } else if (stateTab === "uploaded" || stateTab === "borrowed") {
      setActiveTab(stateTab);
    } else {
      setActiveTab("borrowed");
    }
  }, [queryTab, stateTab]);

  const handleTabChange = (tab: "borrowed" | "uploaded") => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "borrowed") {
          next.delete("tab");
        } else {
          next.set("tab", tab);
        }
        return next;
      },
      { replace: true }
    );
  };

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
    if (!authLoading) {
      if (isAuthenticated && !hasFetched.current) {
        hasFetched.current = true;
        loadBooks();
      } else if (!isAuthenticated) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, loadBooks]);

  const currentBooks = activeTab === "borrowed" ? borrowedBooks : uploadedBooks;

  // Calculate total pending requests across all uploaded books
  const totalPendingRequests = uploadedBooks.reduce(
    (sum, book) => sum + (book.pendingRequestCount || 0),
    0,
  );

  // Show loading while auth is being checked
  if (authLoading) {
    return <LoadingSpinner message="Checking authentication..." fullScreen />;
  }

  // Show sign-in required message if not authenticated
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
            <LogIn className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Sign in required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            Please sign in to view your library and manage your books
          </p>
          <Link
            to="/login"
            state={{ from: "/library" }}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-sm"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => handleTabChange("borrowed")}
          className={`px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
            activeTab === "borrowed"
              ? "bg-red-500 text-white shadow-sm"
              : "bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15"
          }`}
        >
          Borrowed Books
        </button>
        <button
          onClick={() => handleTabChange("uploaded")}
          className={`relative px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
            activeTab === "uploaded"
              ? "bg-red-500 text-white shadow-sm"
              : "bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15"
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
          <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-[#2c2c2e] flex items-center justify-center mb-4">
            {activeTab === "borrowed" ? (
              <BookOpen className="w-10 h-10 text-gray-400" />
            ) : (
              <Upload className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {activeTab === "borrowed"
              ? "No Borrowed Books"
              : "No Uploaded Books"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6 text-sm">
            {activeTab === "borrowed"
              ? "Books you borrow will appear here. Start exploring the Book Store!"
              : "Share your books with the community by uploading them."}
          </p>
          <Link
            to={activeTab === "borrowed" ? "/" : "/upload"}
            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition flex items-center space-x-2 shadow-sm"
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
              <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
              <span>Refreshing...</span>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {currentBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                showPendingBadge={activeTab === "uploaded"}
              />
            ))}

            {/* Add More Card */}
            <Link
              to={activeTab === "borrowed" ? "/" : "/upload"}
              className="flex flex-col items-center justify-center aspect-[2/3] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 transition-colors group cursor-pointer"
            >
              <Plus className="w-10 h-10 text-gray-400 group-hover:text-red-500 transition-colors" />
              <span className="mt-2 text-sm text-gray-500 dark:text-gray-400 group-hover:text-red-500 transition-colors font-medium">
                {activeTab === "borrowed" ? "Borrow More" : "Upload More"}
              </span>
            </Link>
          </div>
        </>
      )}
    </AppLayout>
  );
}
