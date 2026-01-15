import { useNavigate } from "react-router-dom";
import type { BookPreview } from "../types";

interface MobileCategoryCardProps {
  name: string;
  slug: string;
  books: BookPreview[];
  isLoading?: boolean;
}

export function MobileCategoryCard({
  name,
  slug,
  books,
  isLoading = false,
}: MobileCategoryCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/genre/${slug}`)}
      className="w-full bg-[#2c2c2e] rounded-2xl p-4 flex items-center justify-between overflow-hidden group active:scale-[0.98] transition-transform"
    >
      {/* Category Name */}
      <h3 className="text-white font-semibold text-lg">{name}</h3>

      {/* Book Previews - Stacked effect */}
      <div className="flex -space-x-8 pr-2">
        {isLoading ? (
          // Loading skeleton
          <>
            <div className="w-16 h-24 bg-gray-700 rounded-lg animate-pulse transform rotate-[-5deg]" />
            <div className="w-16 h-24 bg-gray-600 rounded-lg animate-pulse" />
            <div className="w-16 h-24 bg-gray-700 rounded-lg animate-pulse transform rotate-[5deg]" />
          </>
        ) : books.length > 0 ? (
          books.slice(0, 3).map((book, index) => (
            <div
              key={book.id}
              className="w-16 h-24 rounded-lg overflow-hidden shadow-xl transition-transform group-hover:scale-105"
              style={{
                transform: `rotate(${(index - 1) * 5}deg)`,
                zIndex: 3 - index,
              }}
            >
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))
        ) : (
          // Placeholder when no books
          <div className="w-16 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-xs">No books</span>
          </div>
        )}
      </div>
    </button>
  );
}
