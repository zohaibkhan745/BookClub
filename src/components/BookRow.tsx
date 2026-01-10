import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { BookPreview } from "../types";

interface BookRowProps {
  title: string;
  books: BookPreview[];
}

export function BookRow({ title, books }: BookRowProps) {
  const navigate = useNavigate();
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const scrollAmount = direction === "left" ? -600 : 600;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });

      setTimeout(() => {
        if (rowRef.current) {
          setShowLeftArrow(rowRef.current.scrollLeft > 0);
          setShowRightArrow(
            rowRef.current.scrollLeft <
              rowRef.current.scrollWidth - rowRef.current.clientWidth - 10
          );
        }
      }, 300);
    }
  };

  const handleBookClick = (bookId: number) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <div className="space-y-2 group">
      <h3 className="text-black text-xl md:text-2xl font-semibold px-0 md:px-0">
        {title}
      </h3>
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-black/30 backdrop-blur-md hover:bg-black/50 border-r border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8 text-black" />
          </button>
        )}

        {/* Books Container */}
        <div
          ref={rowRef}
          className="flex overflow-x-auto space-x-2 md:space-x-3 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {books.map((book) => (
            <div
              key={book.id}
              onClick={() => handleBookClick(book.id)}
              className="flex-none w-36 md:w-48 cursor-pointer transition-transform duration-300 hover:scale-110 hover:z-10"
            >
              <div className="relative group/card">
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-full h-52 md:h-72 object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-xl backdrop-blur-sm">
                  <div className="absolute bottom-0 p-3 w-full bg-black/20 backdrop-blur-md rounded-b-xl border-t border-white/10">
                    <p className="text-white font-semibold text-sm line-clamp-2">
                      {book.title}
                    </p>
                    <p className="text-gray-300 text-xs mt-1">{book.author}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-black/30 backdrop-blur-md hover:bg-black/50 border-l border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-8 h-8 text-black" />
          </button>
        )}
      </div>
    </div>
  );
}
