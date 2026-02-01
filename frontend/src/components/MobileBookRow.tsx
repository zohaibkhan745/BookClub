import { useNavigate } from "react-router-dom";
import type { BookPreview } from "../types";

interface MobileBookRowProps {
  books: BookPreview[];
  isLoading?: boolean;
}

export function MobileBookRow({
  books,
  isLoading = false,
}: MobileBookRowProps) {
  const navigate = useNavigate();

  const skeletonItems = Array.from({ length: 4 }, (_, i) => i);

  return (
    <div
      className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {isLoading ? (
        skeletonItems.map((i) => (
          <div key={i} className="flex-none w-32">
            <div className="w-full h-48 bg-[#2c2c2e] rounded-xl animate-pulse" />
            <div className="mt-2 h-4 bg-[#2c2c2e] rounded animate-pulse w-3/4" />
            <div className="mt-1 h-3 bg-[#2c2c2e] rounded animate-pulse w-1/2" />
          </div>
        ))
      ) : books.length === 0 ? (
        <div className="flex-1 py-8 text-center text-gray-500">
          No books available.
        </div>
      ) : (
        books.map((book) => (
          <button
            key={book.id}
            onClick={() => navigate(`/book/${book.slug || book.id}`)}
            className="flex-none w-32 text-left active:scale-95 transition-transform"
          >
            <div className="relative rounded-xl overflow-hidden shadow-lg">
              <img
                src={book.image}
                alt={book.title}
                loading="lazy"
                decoding="async"
                className="w-full h-48 object-cover bg-gray-800"
              />
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
            </div>
            <h4 className="mt-2 text-white font-medium text-sm line-clamp-2">
              {book.title}
            </h4>
            <p className="text-gray-400 text-xs mt-0.5">{book.author}</p>
          </button>
        ))
      )}
    </div>
  );
}
