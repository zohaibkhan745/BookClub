import {
  ArrowLeft,
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
