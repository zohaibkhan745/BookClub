import {
  User,
  BookOpen,
  Search,
  Moon,
  Sun,
  Home,
  Library,
  LogOut,
  Trophy,
  MessageCircle,
} from "lucide-react";
import { useState, useRef, useEffect, memo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { CreditBadge } from "./CreditBadge";
import { NotificationBell } from "./NotificationBell";


interface ProfileDropdownProps {
  isMobile?: boolean;
  user: { email?: string } | null;
  isAuthenticated: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onNavigate: (path: string) => void;
  onSignOutClick: () => void;
  isSigningOut: boolean;
}

function ProfileDropdown({
  isMobile = false,
  user,
  isAuthenticated,
  theme,
  toggleTheme,
  onNavigate,
  onSignOutClick,
  isSigningOut,
}: ProfileDropdownProps) {
  return (
    <div className="absolute right-0 mt-2 w-56 bg-[#FAF7EE] dark:bg-[#2c2c2e] rounded-xl shadow-xl border border-black/10 dark:border-white/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
      <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
        <p className="font-semibold text-gray-900 dark:text-white">
          {isAuthenticated ? user?.email?.split("@")[0] : "Guest User"}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {isAuthenticated ? user?.email : "Sign in for more features"}
        </p>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleTheme();
        }}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
      >
        <span className="flex items-center space-x-3">
          {theme === "dark" ? (
            <Moon className="w-4 h-4 text-[#64D2FF]" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
          <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
        </span>
        <div
          className={`w-10 h-6 rounded-full transition-colors ${
            theme === "dark" ? "bg-[#64D2FF]" : "bg-[#E5DECA]"
          } relative`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              theme === "dark" ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </div>
      </button>

      {/* Navigation items */}
      <div className="border-t border-black/5 dark:border-white/10 mt-1 pt-1">
        {isMobile && (
          <>
            <button
              onClick={() => onNavigate("/upload")}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
            >
              Upload Book
            </button>
            <button
              onClick={() => onNavigate("/leaderboard")}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-yellow-500" />
              Leaderboard
            </button>
          </>
        )}

        {isAuthenticated && (
          <>
            <button
              onClick={() => onNavigate("/profile")}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
            >
              My Profile
            </button>
            <button
              onClick={() => onNavigate("/settings")}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
            >
              Settings
            </button>
          </>
        )}
      </div>

      {/* Auth Actions */}
      {isAuthenticated && (
        <div className="border-t border-black/5 dark:border-white/10 mt-1 pt-1">
          <button
            onClick={onSignOutClick}
            disabled={isSigningOut}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <LogOut
              className={`w-4 h-4 ${isSigningOut ? "animate-pulse" : ""}`}
            />
            <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export const Navbar = memo(function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  const handleSignOutClick = useCallback(() => {
    setShowSignOutDialog(true);
  }, []);

  const handleSignOutConfirm = async () => {
    setIsSigningOut(true);
    try {
      await signOut();

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("sb-") ||
            key.startsWith("supabase.") ||
            key.startsWith("bookclub_"))
        ) {
          localStorage.removeItem(key);
        }
      }

      setProfileMenuOpen(false);
      setShowSignOutDialog(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("[Navbar] Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOutCancel = useCallback(() => {
    setShowSignOutDialog(false);
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
      setProfileMenuOpen(false);
    },
    [navigate],
  );

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDesktop =
        profileRef.current && !profileRef.current.contains(target);
      const isOutsideMobile =
        mobileProfileRef.current && !mobileProfileRef.current.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "library", label: "Library", icon: Library, path: "/library" },
    {
      id: "community",
      label: "Community",
      icon: MessageCircle,
      path: "/community",
    },
    { id: "search", label: "Search", icon: Search, path: "/search" },
  ];

  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return location.pathname === "/";
      return location.pathname.startsWith(path);
    },
    [location.pathname],
  );

  // Preload route chunks on hover for instant navigation
  const handlePreload = useCallback((path: string) => {
    if (path === "/library") {
      import("../pages/LibraryPage");
    } else if (path === "/search") {
      import("../pages/SearchPage");
    } else if (path === "/community") {
      import("../pages/CommunityPage");
    }
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[rgba(246,240,215,0.85)] dark:bg-[rgba(28,28,30,0.9)] backdrop-blur-md border-b border-black/10 dark:border-white/10 transition-colors">
      <div className="px-4 md:px-12 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg"
          aria-label="BookClub Home"
        >
          <BookOpen className="w-8 h-8 text-red-600" />
          <span className="text-red-600 text-2xl font-bold tracking-tight">
            BookClub
          </span>
        </button>

        {/* Center Navigation - Desktop Only */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => handlePreload(item.path)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all cursor-pointer ${
                  active
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Right Controls */}
        <div className="md:hidden flex items-center space-x-2">
          {isAuthenticated && <CreditBadge />}
          <NotificationBell isMobile={true} />

          {!isAuthenticated && (
            <button
              onClick={() => navigate("/login")}
              className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition shadow-sm"
            >
              Login
            </button>
          )}

          {/* Mobile Profile Icon */}
          <div className="relative" ref={mobileProfileRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition cursor-pointer"
              aria-label="Open user menu"
            >
              <User className="w-5 h-5 text-gray-800 dark:text-white" />
            </button>

            {profileMenuOpen && (
              <ProfileDropdown
                isMobile={true}
                user={user}
                isAuthenticated={isAuthenticated}
                theme={theme}
                toggleTheme={toggleTheme}
                onNavigate={handleNavigate}
                onSignOutClick={handleSignOutClick}
                isSigningOut={isSigningOut}
              />
            )}
          </div>
        </div>

        {/* Desktop Right Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated && <CreditBadge />}

          <NotificationBell isMobile={false} />

          <button
            onClick={() => navigate("/leaderboard")}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition cursor-pointer"
            title="Leaderboard"
            aria-label="Leaderboard"
          >
            <Trophy className="w-5 h-5 text-yellow-500" />
          </button>


          <button
            onClick={() => navigate("/upload")}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-sm hover:shadow cursor-pointer"
          >
            Upload Book
          </button>

          {!isAuthenticated && (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition shadow-sm cursor-pointer"
            >
              Login
            </button>
          )}

          {/* Desktop Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition cursor-pointer"
              aria-label="Open user menu"
            >
              <User className="w-6 h-6 text-gray-800 dark:text-white" />
            </button>

            {profileMenuOpen && (
              <ProfileDropdown
                isMobile={false}
                user={user}
                isAuthenticated={isAuthenticated}
                theme={theme}
                toggleTheme={toggleTheme}
                onNavigate={handleNavigate}
                onSignOutClick={handleSignOutClick}
                isSigningOut={isSigningOut}
              />
            )}
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSignOutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        loadingText="Signing out..."
        isLoading={isSigningOut}
        onConfirm={handleSignOutConfirm}
        onCancel={handleSignOutCancel}
        variant="danger"
      />
    </nav>
  );
});
