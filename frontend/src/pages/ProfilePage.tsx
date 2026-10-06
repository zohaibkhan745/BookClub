/**
 * Profile Page
 * Displays user information and activity statistics.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { AppLayout } from "../components/AppLayout";
import { ProfileHeader, ProfileStats } from "../components/profile";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { Button } from "../components/ui/Button";
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
    return <LoadingSpinner message="Loading profile..." fullScreen />;
  }

  // Extract user info from Supabase user
  const fullName = user?.user_metadata?.full_name || "User";
  const email = user?.email || "";
  const username = email.split("@")[0];
  const createdAt = user?.created_at || new Date().toISOString();

  return (
    <AppLayout maxWidth="4xl">
      <div className="space-y-6">
        {/* Header with Settings link */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <Button
            onClick={() => navigate("/settings")}
            variant="secondary"
            size="md"
            icon={<Settings className="w-4 h-4" />}
          >
            Settings
          </Button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadStats} />
        ) : (
          <>
            {/* User Profile Header Card */}
            <ProfileHeader
              fullName={fullName}
              username={username}
              email={email}
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
    </AppLayout>
  );
}
