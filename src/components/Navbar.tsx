import { User, Menu, X, BookOpen } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(246,240,215,0.8)] backdrop-blur-md border-b border-[rgba(0,0,0,0.1)]">
      <div className="px-4 md:px-12 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <BookOpen className="w-8 h-8 text-red-600" />
          <span className="text-red-600 text-2xl font-bold">BookClub</span>
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition cursor-pointer"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5 text-black" />
          ) : (
            <Menu className="w-5 h-5 text-black" />
          )}
        </button>

        {/* Right Side */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={() => navigate("/upload")}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition"
          >
            Upload Book
          </button>
          <button className="p-2 hover:bg-[rgba(0,0,0,0.05)] rounded-full transition">
            <User className="w-6 h-6 text-black" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[rgba(246,240,215,0.8)] backdrop-blur-md border-b border-[rgba(0,0,0,0.1)]">
          <ul className="px-4 py-2 space-y-2">
            <li className="text-black hover:text-gray-700 cursor-pointer transition">
              Home
            </li>
            <li className="text-gray-700 hover:text-black cursor-pointer transition">
              Browse
            </li>
            <li className="text-gray-700 hover:text-black cursor-pointer transition">
              My Books
            </li>
            <li className="text-gray-700 hover:text-black cursor-pointer transition">
              Lend
            </li>
            <li className="text-gray-700 hover:text-black cursor-pointer transition">
              Borrow
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
