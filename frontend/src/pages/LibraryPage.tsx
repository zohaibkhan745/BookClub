import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { BookOpen, Upload, Plus } from "lucide-react";
import { getAllBookSections } from "../services";
import type { BookPreview, ApiError } from "../types";

export function LibraryPage() {
  const [borrowedBooks, setBorrowedBooks] = useState<BookPreview[]>([]);
  const [uploadedBooks, setUploadedBooks] = useState<BookPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"borrowed" | "uploaded">(
    "borrowed"
  );

  const loadBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For now, we'll simulate user's books from the general book sections
      // In a real app, this would fetch user-specific data
      const sections = await getAllBookSections();
      // Simulate borrowed books (first few trending)
      setBorrowedBooks(sections.trending.slice(0, 3));
      // Simulate uploaded books (first few new arrivals)
      setUploadedBooks(sections.newArrivals.slice(0, 2));
    } catch (err) {
      const apiError = err as ApiError;
      setError(
        apiError.message || "Failed to load your library. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const currentBooks = activeTab === "borrowed" ? borrowedBooks : uploadedBooks;

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
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              activeTab === "uploaded"
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            My Uploads
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
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
              to={activeTab === "borrowed" ? "/store" : "/upload"}
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
              to={activeTab === "borrowed" ? "/store" : "/upload"}
              className="flex flex-col items-center justify-center aspect-[2/3] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-500 transition-colors group"
            >
              <Plus className="w-10 h-10 text-gray-400 group-hover:text-red-500 transition-colors" />
              <span className="mt-2 text-sm text-gray-500 dark:text-gray-400 group-hover:text-red-500 transition-colors">
                {activeTab === "borrowed" ? "Borrow More" : "Upload More"}
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
