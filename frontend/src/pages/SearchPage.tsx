import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { AppLayout } from "../components/AppLayout";
import { BookCard } from "../components/BookCard";
import { useBookSections } from "../hooks/useBooks";
import { searchBooks } from "../services";
import type { BookPreview } from "../types";

type StatusFilter = "all" | "available" | "borrowed";

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchResults, setSearchResults] = useState<BookPreview[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // SWR handles caching, dedup, and background revalidation automatically
  const { sections, isLoading } = useBookSections();

  // Combine all section books into a single featured list, deduped by id
  const allFeatured = useMemo(() => {
    if (!sections) return [];
    const seen = new Set<string>();
    const result: BookPreview[] = [];
    for (const book of [
      ...(sections.trending || []),
      ...(sections.newArrivals || []),
      ...(sections.popular || []),
    ]) {
      if (!seen.has(book.id)) {
        seen.add(book.id);
        result.push(book);
      }
    }
    return result;
  }, [sections]);

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

  // Filter books by status
  const filterByStatus = useCallback(
    (books: BookPreview[]) => {
      if (statusFilter === "available") {
        return books.filter(
          (b) => b.isBorrowed === false || b.isAvailable !== false,
        );
      }
      if (statusFilter === "borrowed") {
        return books.filter(
          (b) => b.isBorrowed === true || b.isAvailable === false,
        );
      }
      return books;
    },
    [statusFilter],
  );

  const displayedSearchResults = useMemo(
    () => filterByStatus(searchResults),
    [filterByStatus, searchResults],
  );

  const displayedFeatured = useMemo(
    () => filterByStatus(allFeatured),
    [filterByStatus, allFeatured],
  );

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
    <AppLayout>
      {/* Search Input Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books by title, author, or keywords"
          className="w-full pl-12 pr-10 py-3 md:py-4 bg-white dark:bg-[#2c2c2e] rounded-xl md:rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSearchResults([]);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto scrollbar-none py-1">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all cursor-pointer ${
            statusFilter === "all"
              ? "bg-red-500 text-white shadow-sm"
              : "bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15"
          }`}
        >
          All Books
        </button>
        <button
          onClick={() => setStatusFilter("available")}
          className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all cursor-pointer ${
            statusFilter === "available"
              ? "bg-red-500 text-white shadow-sm"
              : "bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15"
          }`}
        >
          Available
        </button>
        <button
          onClick={() => setStatusFilter("borrowed")}
          className={`px-4 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all cursor-pointer ${
            statusFilter === "borrowed"
              ? "bg-red-500 text-white shadow-sm"
              : "bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/15"
          }`}
        >
          Borrowed
        </button>
      </div>

      {/* Query Results or Categories + Catalog */}
      {query ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Search Results
            </h2>
            {isSearching && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                <span>Searching...</span>
              </div>
            )}
          </div>

          {displayedSearchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayedSearchResults.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : !isSearching ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">
              {statusFilter === "borrowed"
                ? `No borrowed books match "${query}".`
                : statusFilter === "available"
                  ? `No available books match "${query}".`
                  : `No results found for "${query}". Try searching for a different term.`}
            </p>
          ) : null}
        </section>
      ) : (
        <>
          {/* Browse Categories */}
          {statusFilter === "all" && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                Browse Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => navigate(`/genre/${category.slug}`)}
                    className="rounded-xl py-4 px-4 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm cursor-pointer"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="font-semibold text-sm" style={{ color: "#333" }}>
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Featured / Catalog Section */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              {statusFilter === "available"
                ? "Available Books"
                : statusFilter === "borrowed"
                  ? "Currently Borrowed Books"
                  : "All Books"}
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div
                    key={i}
                    className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : displayedFeatured.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayedFeatured.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                {statusFilter === "borrowed"
                  ? "No books are currently borrowed in the community."
                  : "No books available yet."}
              </p>
            )}
          </section>
        </>
      )}
    </AppLayout>
  );
}
