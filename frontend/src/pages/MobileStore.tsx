import { User, ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { MobileBookRow } from "../components/MobileBookRow";
import { useState, useEffect } from "react";
import { getAllBookSections } from "../services";
import type { BookPreview, ApiError } from "../types";

export function MobileStore() {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const [trending, setTrending] = useState<BookPreview[]>([]);
  const [newArrivals, setNewArrivals] = useState<BookPreview[]>([]);
  const [popular, setPopular] = useState<BookPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const sections = await getAllBookSections();
        setTrending(sections.trending);
        setNewArrivals(sections.newArrivals);
        setPopular(sections.popular);
      } catch (err) {
        console.error("Failed to load books:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadBooks();
  }, []);

  const featuredCollections = [
    { name: "Biography", slug: "biography" },
    { name: "Self Help", slug: "self-help" },
    { name: "Fiction", slug: "fiction" },
    { name: "History", slug: "history" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Book Store</h1>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-[#2c2c2e] rounded-full text-sm font-medium">
              Sections
            </button>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border-2 border-[#64D2FF] flex items-center justify-center"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 space-y-8 pb-8">
        {/* Featured Collections - Horizontal scroll */}
        <section>
          <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
            {featuredCollections.map((collection) => (
              <button
                key={collection.slug}
                onClick={() => navigate(`/genre/${collection.slug}`)}
                className="flex-none"
              >
                <div className="bg-[#2c2c2e] rounded-2xl p-4 w-72 h-48 relative overflow-hidden group active:scale-[0.98] transition-transform">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Featured Collection
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {collection.name}
                  </h3>
                  {/* Book stack preview would go here */}
                  <div className="absolute right-4 bottom-4 flex -space-x-6">
                    {trending.slice(0, 3).map((book, i) => (
                      <div
                        key={book.id}
                        className="w-14 h-20 rounded-lg overflow-hidden shadow-xl"
                        style={{
                          transform: `rotate(${(i - 1) * 8}deg) translateY(${
                            i * 5
                          }px)`,
                          zIndex: 3 - i,
                        }}
                      >
                        <img
                          src={book.image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Fiction & Literature */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Fiction & Literature</h2>
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

        {/* Upload Book Button */}
        <button
          onClick={() => navigate("/upload")}
          className="w-full py-4 bg-gradient-to-r from-[#64D2FF] to-[#5AC8FA] rounded-2xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform"
        >
          <Plus className="w-5 h-5 text-black" />
          <span className="font-semibold text-black">Upload Your Book</span>
        </button>
      </main>

      <MobileBottomNav />
    </div>
  );
}
