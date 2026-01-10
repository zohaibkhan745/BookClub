import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { BookRow } from "../components/BookRow";
import { CategorySection } from "../components/CategorySection";
import { Footer } from "../components/Footer";
import { getAllBookSections } from "../services";
import type { BookPreview } from "../types";

export function Home() {
  const [trending, setTrending] = useState<BookPreview[]>([]);
  const [newArrivals, setNewArrivals] = useState<BookPreview[]>([]);
  const [popular, setPopular] = useState<BookPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBooks() {
      setIsLoading(true);
      const sections = await getAllBookSections();
      setTrending(sections.trending);
      setNewArrivals(sections.newArrivals);
      setPopular(sections.popular);
      setIsLoading(false);
    }
    loadBooks();
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F0D7]">
      <Navbar />

      <div className="pt-20 px-4 md:px-12 pb-8 bg-[rgba(240,255,223,0)]">
        <CategorySection />
      </div>

      <div className="px-4 md:px-12 pb-12 space-y-12">
        <BookRow title="Trending Now" books={trending} isLoading={isLoading} />
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
      </div>

      <Footer />
    </div>
  );
}
