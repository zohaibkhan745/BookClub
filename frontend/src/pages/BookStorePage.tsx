import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { getAllBookSections, getBooksByGenre } from "../services";
import type { BookPreview, ApiError } from "../types";

export function BookStorePage() {
  const navigate = useNavigate();
  const [allBooks, setAllBooks] = useState<BookPreview[]>([]);
  const [trending, setTrending] = useState<BookPreview[]>([]);
  const [newArrivals, setNewArrivals] = useState<BookPreview[]>([]);
  const [popular, setPopular] = useState<BookPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sections = await getAllBookSections();
      setTrending(sections.trending);
      setNewArrivals(sections.newArrivals);
      setPopular(sections.popular);

      // Combine all unique books
      const allBooksMap = new Map<number, BookPreview>();
      [
        ...sections.trending,
        ...sections.newArrivals,
        ...sections.popular,
      ].forEach((book) => {
        allBooksMap.set(book.id, book);
      });
      setAllBooks(Array.from(allBooksMap.values()));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to load books. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const categories = [
    { name: "Fiction", slug: "fiction", color: "from-blue-500 to-cyan-500" },
    {
      name: "Non-Fiction",
      slug: "non-fiction",
      color: "from-green-500 to-emerald-500",
    },
    {
      name: "Self Help",
      slug: "self-help",
      color: "from-pink-500 to-rose-500",
    },
    { name: "History", slug: "history", color: "from-red-500 to-pink-500" },
    {
      name: "Biography",
      slug: "biography",
      color: "from-teal-500 to-green-500",
    },
    {
      name: "Science Fiction",
      slug: "science-fiction",
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const BookRow = ({
    title,
    books,
    showAll,
  }: {
    title: string;
    books: BookPreview[];
    showAll?: boolean;
  }) => (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white">
          {title}
        </h2>
        {!showAll && (
          <button className="flex items-center text-red-500 hover:text-red-600 transition">
            <span className="text-sm font-medium">See All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <div
        className="flex overflow-x-auto space-x-3 md:space-x-4 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/book/${book.id}`}
            className="flex-none w-32 md:w-40 group"
          >
            <div className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-48 md:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h4 className="mt-2 text-black dark:text-white font-medium text-sm line-clamp-2">
              {book.title}
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              {book.author}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-[#F6F0D7]/90 dark:bg-black/90 backdrop-blur-xl px-4 pt-12 pb-4 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Book Store
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-4 md:pt-24 px-4 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto">
        {isLoading ? (
          <LoadingSpinner message="Loading books..." />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={loadBooks}
            showHomeLink={false}
          />
        ) : (
          <>
            {/* Featured Categories - Horizontal scroll on mobile, grid on desktop */}
            <section className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-4">
                Browse Categories
              </h2>
              <div className="flex md:grid md:grid-cols-3 lg:grid-cols-6 overflow-x-auto md:overflow-visible gap-3 pb-2 md:pb-0 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => navigate(`/genre/${category.slug}`)}
                    className={`flex-none w-36 md:w-auto bg-gradient-to-br ${category.color} rounded-2xl p-4 md:p-6 text-white font-semibold hover:scale-105 transition-transform shadow-lg`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Book Sections */}
            <BookRow title="Trending Now" books={trending} />
            <BookRow title="New Arrivals" books={newArrivals} />
            <BookRow title="Popular This Week" books={popular} />

            {/* All Books Grid */}
            <section className="mt-12">
              <h2 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-4">
                All Books
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {allBooks.map((book) => (
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
              </div>
            </section>
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
