import { User, BookOpen } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { MobileBottomNav } from "../components/MobileBottomNav";

export function MobileLibrary() {
  const { toggleTheme } = useTheme();

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
