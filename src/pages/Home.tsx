import { Navbar } from "../components/Navbar";
import { BookRow } from "../components/BookRow";
import { CategorySection } from "../components/CategorySection";
import { Footer } from "../components/Footer";
import { trendingBooks, newArrivals, popularThisWeek } from "../data";

export function Home() {
  return (
    <div className="min-h-screen bg-[#F6F0D7]">
      <Navbar />

      <div className="pt-20 px-4 md:px-12 pb-8 bg-[rgba(240,255,223,0)]">
        <CategorySection />
      </div>

      <div className="px-4 md:px-12 pb-12 space-y-12">
        <BookRow title="Trending Now" books={trendingBooks} />
        <BookRow title="New Arrivals" books={newArrivals} />
        <BookRow title="Popular This Week" books={popularThisWeek} />
      </div>

      <Footer />
    </div>
  );
}
