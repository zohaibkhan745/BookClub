import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { getAllBookSections, searchBooks } from "../services";
import type { BookPreview } from "../types";

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [trending, setTrending] = useState<BookPreview[]>([]);
  const [searchResults, setSearchResults] = useState<BookPreview[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const sections = await getAllBookSections();
        setTrending(sections.trending);
      } catch (err) {
        console.error("Failed to load trending:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTrending();
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search with proper cleanup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query, handleSearch]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const categories = [
    { name: "Self Help", slug: "self-help", color: "#F7DB91" },
    { name: "Philosophy", slug: "philosophy", color: "#FFFBB1" },
    { name: "Fiction", slug: "fiction", color: "#E8D5B7" },
    { name: "Romance", slug: "romance", color: "#F5C6D0" },
    { name: "Non-Fiction", slug: "non-fiction", color: "#D4C5E0" },
    { name: "History", slug: "history", color: "#C9D4C5" },
    { name: "Biography", slug: "biography", color: "#B8D4D4" },
    { name: "Science", slug: "science", color: "#C5D8E0" },
    { name: "Technology", slug: "technology", color: "#D0D8E8" },
    { name: "Poetry", slug: "poetry", color: "#E8D8E0" },
  ];

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      {/* Main Content */}
      <main className="pt-20 px-4 md:px-12 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search books"
            className="w-full pl-12 pr-10 py-3 md:py-4 bg-white dark:bg-[#2c2c2e] rounded-xl md:rounded-2xl text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSearchResults([]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {query ? (
          // Search Results
          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
              {isSearching ? "Searching..." : `Results for "${query}"`}
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((book) => (
                  <Link
                    key={book.id}
                    to={`/book/${book.slug || book.id}`}
                    className="group"
                  >
                    <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      <img
                        src={book.image}
                        alt={book.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300 bg-gray-200 dark:bg-gray-700"
                      />
                    </div>
                    <h4 className="mt-2 text-black dark:text-white font-medium text-sm line-clamp-2">
                      {book.title}
                    </h4>
                    <p className="text-gray-500 text-xs">{book.author}</p>
                  </Link>
                ))}
              </div>
            ) : !isSearching ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No results found. Try searching for a different term.
              </p>
            ) : null}
          </section>
        ) : (
          <>
            {/* Browse Categories */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-3">
                Browse Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => navigate(`/genre/${category.slug}`)}
                    className="rounded-xl py-4 px-4 text-left hover:scale-105 transition-transform shadow-lg"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="font-semibold" style={{ color: "#333" }}>
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Featured */}
            <section>
              <h2 className="text-lg font-semibold text-black dark:text-white mb-3">
                Featured
              </h2>
              {isLoading ? (
                <div className="flex space-x-3 overflow-x-auto">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-none w-32">
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                  {trending.map((book) => (
                    <Link
                      key={book.id}
                      to={`/book/${book.slug || book.id}`}
                      className="flex-none w-32 group"
                    >
                      <div className="rounded-xl overflow-hidden shadow-lg">
                        <img
                          src={book.image}
                          alt={book.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 bg-gray-200 dark:bg-gray-700"
                        />
                      </div>
                      <h4 className="mt-2 text-black dark:text-white font-medium text-sm line-clamp-2">
                        {book.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              )}
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
