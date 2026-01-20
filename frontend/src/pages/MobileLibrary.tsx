import { User, BookOpen, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export function MobileLibrary() {
  const { toggleTheme } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }

  // Show sign-in required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl px-4 pt-12 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Library</h1>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border-2 border-[#64D2FF] flex items-center justify-center"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </header>

        {/* Sign In Required Message */}
        <main className="px-4 py-8">
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-red-900/30 flex items-center justify-center mb-6">
              <LogIn className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Sign in required
            </h2>
            <p className="text-gray-400 max-w-xs mb-8">
              Please sign in to view your library and manage your books
            </p>
            <Link
              to="/login"
              state={{ from: "/library" }}
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Link>
          </div>
        </main>

        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Library</h1>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border-2 border-[#64D2FF] flex items-center justify-center"
          >
            <User className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-8">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-[#2c2c2e] flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Your Library
          </h2>
          <p className="text-gray-400 max-w-xs">
            Books you borrow or purchase will appear here. Start exploring to
            build your collection!
          </p>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
