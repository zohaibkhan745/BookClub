/**
 * Profile Page
 * Displays user information and activity statistics.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { ProfileHeader, ProfileStats } from "../components/profile";
import { ErrorState } from "../components/ui/ErrorState";
import { useAuth } from "../context/AuthContext";
import { getUserStats } from "../services";
import type { UserStats } from "../types";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { state: { from: "/profile" } });
      return;
    }

    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (err) {
      setError("Failed to load profile data. Please try again.");
      console.error("[ProfilePage] Error loading stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e]">
        <Navbar />
        <div className="pt-24 pb-12 px-4 md:px-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
        </div>
      </div>
    );
  }

  // Extract user info from Supabase user
  const fullName = user?.user_metadata?.full_name || "User";
  const email = user?.email || "";
  const username = email.split("@")[0];
  const createdAt = user?.created_at || new Date().toISOString();

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Profile
            </h1>
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2c2c2e] rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-[#3c3c3e] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          {error ? (
            <ErrorState message={error} onRetry={loadStats} />
          ) : (
            <>
              {/* User Header */}
              <ProfileHeader
                fullName={fullName}
                email={email}
                username={username}
                createdAt={createdAt}
              />

              {/* Activity Stats */}
              <ProfileStats
                stats={
                  stats || { booksListed: 0, booksSold: 0, booksBorrowed: 0 }
                }
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  );
}
