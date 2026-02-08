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
import {
  LazyLibraryPage,
  LazySearchPage,
  LazyCommunityPage,
} from "./LazyPages";

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
      // Sign out from Supabase (clears session)
      await signOut();

      // Clear all localStorage data
      localStorage.clear();

      // Close menu and redirect to home
      setProfileMenuOpen(false);
      setShowSignOutDialog(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("[Navbar] Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  const handleSignOutCancel = useCallback(() => {
    setShowSignOutDialog(false);
  }, []);

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
  const preloadMap: Record<string, { preload?: () => void }> = {
    "/library": LazyLibraryPage as unknown as { preload: () => void },
    "/search": LazySearchPage as unknown as { preload: () => void },
    "/community": LazyCommunityPage as unknown as { preload: () => void },
  };

  const handlePreload = useCallback((path: string) => {
    const component = preloadMap[path];
    if (component?.preload) component.preload();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(246,240,215,0.8)] dark:bg-[rgba(28,28,30,0.9)] backdrop-blur-md border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
      <div className="px-4 md:px-12 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <BookOpen className="w-8 h-8 text-red-600" />
          <span className="text-red-600 text-2xl font-bold">BookClub</span>
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
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                  active
                    ? "bg-red-500 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Profile Area */}
        <div className="md:hidden flex items-center space-x-2">
          {/* Credit Badge - Only show when authenticated */}
          {isAuthenticated && <CreditBadge />}

          {/* Login Button - Only show when not authenticated */}
          {!isAuthenticated && (
            <button
              onClick={() => navigate("/login")}
              className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition"
            >
              Login
            </button>
          )}

          {/* Profile Icon */}
          <div className="relative" ref={mobileProfileRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition cursor-pointer"
            >
              <User className="w-5 h-5 text-black dark:text-white" />
            </button>

            {/* Mobile Profile Dropdown */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#2c2c2e] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {isAuthenticated
                      ? user?.email?.split("@")[0]
                      : "Guest User"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {isAuthenticated
                      ? user?.email
                      : "Sign in for more features"}
                  </p>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <span className="flex items-center space-x-3">
                    {theme === "dark" ? (
                      <Moon className="w-5 h-5 text-[#64D2FF]" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="text-gray-700 dark:text-gray-200">
                      {theme === "dark" ? "Dark Mode" : "Light Mode"}
                    </span>
                  </span>
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      theme === "dark" ? "bg-[#64D2FF]" : "bg-gray-300"
                    } relative`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        theme === "dark" ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </div>
                </button>

                <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                  <button
                    onClick={() => {
                      navigate("/upload");
                      setProfileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Upload Book
                  </button>
                  <button
                    onClick={() => {
                      navigate("/leaderboard");
                      setProfileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Leaderboard
                  </button>
                  {isAuthenticated && (
                    <>
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate("/settings");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        Settings
                      </button>
                    </>
                  )}
                </div>

                {/* Auth Actions - Only show Sign Out when authenticated */}
                {isAuthenticated && (
                  <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                    <button
                      onClick={handleSignOutClick}
                      disabled={isSigningOut}
                      className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut
                        className={`w-4 h-4 ${isSigningOut ? "animate-pulse" : ""}`}
                      />
                      <span>
                        {isSigningOut ? "Signing out..." : "Sign Out"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Desktop Only */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Credit Badge - Only show when authenticated */}
          {isAuthenticated && <CreditBadge />}

          {/* Leaderboard Button */}
          <button
            onClick={() => navigate("/leaderboard")}
            className="p-2 hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.1)] rounded-full transition"
            title="Leaderboard"
          >
            <Trophy className="w-5 h-5 text-yellow-500" />
          </button>

          <button
            onClick={() => navigate("/upload")}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition shadow-sm hover:shadow-md"
          >
            Upload Book
          </button>

          {/* Login Button - Only show when not authenticated */}
          {!isAuthenticated && (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition"
            >
              Login
            </button>
          )}

          {/* Profile Dropdown - Desktop */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="p-2 hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.1)] rounded-full transition"
            >
              <User className="w-6 h-6 text-black dark:text-white" />
            </button>

            {/* Desktop Profile Dropdown */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#2c2c2e] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {isAuthenticated
                      ? user?.email?.split("@")[0]
                      : "Guest User"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {isAuthenticated
                      ? user?.email
                      : "Sign in for more features"}
                  </p>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <span className="flex items-center space-x-3">
                    {theme === "dark" ? (
                      <Moon className="w-5 h-5 text-[#64D2FF]" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="text-gray-700 dark:text-gray-200">
                      {theme === "dark" ? "Dark Mode" : "Light Mode"}
                    </span>
                  </span>
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      theme === "dark" ? "bg-[#64D2FF]" : "bg-gray-300"
                    } relative`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        theme === "dark" ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </div>
                </button>

                <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                  {isAuthenticated && (
                    <>
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate("/settings");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        Settings
                      </button>
                    </>
                  )}
                </div>

                {/* Auth Actions - Only show Sign Out when authenticated */}
                {isAuthenticated && (
                  <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                    <button
                      onClick={handleSignOutClick}
                      disabled={isSigningOut}
                      className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut
                        className={`w-4 h-4 ${isSigningOut ? "animate-pulse" : ""}`}
                      />
                      <span>
                        {isSigningOut ? "Signing out..." : "Sign Out"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
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
        isLoading={isSigningOut}
        onConfirm={handleSignOutConfirm}
        onCancel={handleSignOutCancel}
        variant="danger"
      />
    </nav>
  );
});
