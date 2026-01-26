import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { MobileBookRow } from "../components/MobileBookRow";
import { getAllBookSections, searchBooks } from "../services";
import type { BookPreview } from "../types";

export function MobileSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [recentSearches] = useState(["Fiction", "History", "Self Help"]);
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

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search by title or author
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    // Debounced search
    const timeoutId = setTimeout(() => handleSearch(value), 500);
    return () => clearTimeout(timeoutId);
  };

  const categories = [
    { name: "Self Help", slug: "self-help", color: "bg-amber-400" },
    { name: "Philosophy", slug: "philosophy", color: "bg-yellow-400" },
    { name: "Fiction", slug: "fiction", color: "bg-orange-400" },
    { name: "Romance", slug: "romance", color: "bg-rose-400" },
    { name: "Non-Fiction", slug: "non-fiction", color: "bg-purple-400" },
    { name: "History", slug: "history", color: "bg-emerald-500" },
    { name: "Biography", slug: "biography", color: "bg-teal-500" },
    { name: "Science", slug: "science", color: "bg-cyan-500" },
    { name: "Technology", slug: "technology", color: "bg-blue-500" },
    { name: "Poetry", slug: "poetry", color: "bg-indigo-400" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl px-4 pt-12 pb-4">
        <h1 className="text-3xl font-bold mb-4">Search</h1>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Books, Authors, Genres..."
            className="w-full pl-12 pr-10 py-3 bg-[#2c2c2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#64D2FF]"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSearchResults([]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="px-4 space-y-6">
        {query ? (
          // Search Results
          <section>
            <h2 className="text-lg font-semibold mb-4">
              {isSearching ? "Searching..." : `Results for "${query}"`}
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {searchResults.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => navigate(`/book/${book.id}`)}
                    className="text-left active:scale-95 transition-transform"
                  >
                    <div className="rounded-xl overflow-hidden">
                      <img
                        src={book.image}
                        alt={book.title}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                    <h4 className="mt-2 text-white font-medium text-xs line-clamp-2">
                      {book.title}
                    </h4>
                  </button>
                ))}
              </div>
            ) : !isSearching ? (
              <p className="text-gray-400 text-center py-8">
                No results found. Try searching for a different term.
              </p>
            ) : null}
          </section>
        ) : (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Recent Searches</h2>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleQueryChange(search)}
                      className="px-4 py-2 bg-[#2c2c2e] rounded-full text-sm text-gray-300 active:bg-[#3c3c3e] transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Browse Categories */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Browse Categories</h2>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => navigate(`/genre/${category.slug}`)}
                    className={`${category.color} rounded-xl py-4 px-4 text-left active:scale-[0.98] transition-transform`}
                  >
                    <span className="font-semibold text-white">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Featured */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Featured</h2>
              <MobileBookRow books={trending} isLoading={isLoading} />
            </section>
          </>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
