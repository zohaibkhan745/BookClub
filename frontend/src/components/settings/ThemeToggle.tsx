/**
 * ThemeToggle Component
 * Toggle between light and dark themes using ThemeContext as single source of truth.
 */

import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative inline-flex h-10 w-20 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-[#1c1c1e]"
      style={{
        backgroundColor: theme === "dark" ? "#374151" : "#e5e7eb",
      }}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span
        className={`inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
          theme === "dark" ? "translate-x-10" : "translate-x-1"
        }`}
      >
        {theme === "light" ? (
          <Sun className="h-5 w-5 text-amber-500" />
        ) : (
          <Moon className="h-5 w-5 text-gray-700" />
        )}
      </span>
    </button>
  );
}
