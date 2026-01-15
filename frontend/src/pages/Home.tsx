import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { BookRow } from "../components/BookRow";
import { CategorySection } from "../components/CategorySection";
import { Footer } from "../components/Footer";
import { ErrorState } from "../components/ui/ErrorState";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { getAllBookSections } from "../services";
import type { BookPreview, ApiError } from "../types";

export function Home() {
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

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <div className="pt-20 px-4 md:px-12 pb-8 bg-[rgba(240,255,223,0)]">
        <CategorySection />
      </div>

      <div className="px-4 md:px-12 pb-12 md:pb-12 pb-24 space-y-12">
        {error ? (
          <ErrorState
            message={error}
            onRetry={loadBooks}
            showHomeLink={false}
          />
        ) : (
          <>
            <BookRow
              title="Trending Now"
              books={trending}
              isLoading={isLoading}
            />
            <BookRow
              title="New Arrivals"
              books={newArrivals}
              isLoading={isLoading}
            />
            <BookRow
              title="Popular This Week"
              books={popular}
              isLoading={isLoading}
            />
          </>
        )}
      </div>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
