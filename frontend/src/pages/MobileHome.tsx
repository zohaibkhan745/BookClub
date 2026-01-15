import { User, ChevronRight } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { MobileCategoryCard } from "../components/MobileCategoryCard";
import { MobileBookRow } from "../components/MobileBookRow";
import { useState, useEffect } from "react";
import { getAllBookSections } from "../services";
import type { BookPreview, ApiError } from "../types";

export function MobileHome() {
  const { theme, toggleTheme } = useTheme();
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
    {
      name: "Fiction & Literature",
      slug: "fiction",
      books: trending.slice(0, 3),
    },
    {
      name: "Non-Fiction",
      slug: "non-fiction",
      books: newArrivals.slice(0, 3),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Home</h1>
          <div className="flex items-center space-x-3">
            {/* Theme indicator */}
            <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center">
              <span className="text-[#64D2FF] text-sm font-bold">0</span>
            </div>
            {/* Profile button with theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border-2 border-[#64D2FF] flex items-center justify-center"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 space-y-8">
        {/* More to Explore Section */}
        <section>
          <h2 className="text-xl font-bold mb-4">More to Explore</h2>
          <div className="space-y-4">
            {categories.map((category) => (
              <MobileCategoryCard
                key={category.slug}
                name={category.name}
                slug={category.slug}
                books={category.books}
                isLoading={isLoading}
              />
            ))}
          </div>
        </section>

        {/* All-Time Bestsellers */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">All-Time Bestsellers</h2>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>
          <MobileBookRow books={trending} isLoading={isLoading} />
        </section>

        {/* New Arrivals */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">New Arrivals</h2>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>
          <MobileBookRow books={newArrivals} isLoading={isLoading} />
        </section>

        {/* Popular This Week */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Popular This Week</h2>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </div>
          <MobileBookRow books={popular} isLoading={isLoading} />
        </section>
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
