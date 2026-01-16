import {
  ArrowLeft,
  Heart,
  Share2,
  BookmarkPlus,
  MessageCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Book } from "../types";

interface BookDetailProps {
  book: Book;
}

/** Opens WhatsApp chat with pre-filled message */
function openWhatsApp(phoneNumber: string, bookTitle: string) {
  // Remove any non-digit characters from phone number
  const cleanNumber = phoneNumber.replace(/\D/g, "");

  // Create message
  const message = encodeURIComponent(
    `Hi! I'm interested in borrowing "${bookTitle}" from the Book Club app. Is it still available?`
  );

  // Open WhatsApp (works on both mobile and desktop)
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
  window.open(whatsappUrl, "_blank");
}

export function BookDetail({ book }: BookDetailProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const handleBorrowClick = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (book.whatsappNumber) {
      openWhatsApp(book.whatsappNumber, book.title);
    } else {
      alert("Contact information not available for this book.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F0D7] pt-24 pb-0">
      <div className="px-4 md:px-12 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-700 hover:text-black mb-8 transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Book Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-orange-200 rounded-2xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <img
                src={book.image}
                alt={book.title}
                className="relative w-full max-w-md h-auto rounded-2xl shadow-2xl object-cover"
              />
              {/* Floating Action Buttons */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <button className="p-3 bg-white/80 backdrop-blur-md rounded-full hover:bg-white transition shadow-lg">
                  <Heart className="w-5 h-5 text-red-600" />
                </button>
                <button className="p-3 bg-white/80 backdrop-blur-md rounded-full hover:bg-white transition shadow-lg">
                  <Share2 className="w-5 h-5 text-gray-700" />
                </button>
                <button className="p-3 bg-white/80 backdrop-blur-md rounded-full hover:bg-white transition shadow-lg">
                  <BookmarkPlus className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Book Information */}
          <div className="space-y-6 flex flex-col justify-center">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight">
              {book.title}
            </h1>

            {/* Author */}
            <p className="text-xl md:text-2xl text-gray-700">
              by <span className="font-semibold text-black">{book.author}</span>
            </p>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < book.rating ? "text-yellow-500" : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600 text-sm">
                ({book.rating}.0/5.0)
              </span>
            </div>

            {/* Book Details */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Published</p>
                <p className="font-semibold text-black">{book.year}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Pages</p>
                <p className="font-semibold text-black">{book.pages}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Language</p>
                <p className="font-semibold text-black">{book.language}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Genre</p>
                <p className="font-semibold text-black">{book.genre}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-black text-lg">
                About this book
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {book.description}
              </p>
            </div>

            {/* Price (if selling) */}
            {book.listingType === "sell" && book.price && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700">Price</p>
                <p className="text-2xl font-bold text-green-800">
                  PKR {book.price}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleBorrowClick}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {book.listingType === "sell" ? "Buy" : "Borrow"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
