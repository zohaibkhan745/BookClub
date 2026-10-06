import { useState, useEffect } from "react";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Trophy, Medal, Award, Coins, BookOpen, Star } from "lucide-react";
import { apiGet } from "../services/api";

interface LeaderboardEntry {
  id: string;
  full_name: string;
  credits: number;
  books_uploaded: number;
  rank: number;
  badge: "gold" | "silver" | "bronze" | "novice" | "librarian" | "pillar";
}

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiGet<{ data: LeaderboardEntry[] }>(
        "/users/leaderboard?limit=10",
      );
      setLeaderboard(res.data || []);
    } catch {
      setError("Failed to load leaderboard. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <span className="font-bold text-gray-500 dark:text-gray-400 w-6 text-center">
            {rank}
          </span>
        );
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/10 dark:bg-yellow-500/5 border-l-4 border-yellow-500";
      case 2:
        return "bg-gray-500/10 dark:bg-gray-500/5 border-l-4 border-gray-400";
      case 3:
        return "bg-amber-600/10 dark:bg-amber-600/5 border-l-4 border-amber-600";
      default:
        return "hover:bg-black/5 dark:hover:bg-white/5";
    }
  };

  const getBadgeIcon = (badge: LeaderboardEntry["badge"]) => {
    switch (badge) {
      case "pillar":
        return (
          <span
            title="Community Pillar (20+ books)"
            className="inline-flex items-center"
          >
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </span>
        );
      case "librarian":
        return (
          <span
            title="Librarian (5-19 books)"
            className="inline-flex items-center"
          >
            <Award className="h-4 w-4 text-blue-500" />
          </span>
        );
      default:
        return (
          <span title="Novice (1-4 books)" className="inline-flex items-center">
            <Award className="h-4 w-4 text-gray-400" />
          </span>
        );
    }
  };

  return (
    <AppLayout maxWidth="4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Leaderboard
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Top contributors ranked by credits earned
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner message="Loading leaderboard..." size="md" />
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 mb-6">
          <CardContent className="py-6 text-center text-red-600 dark:text-red-400 text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table Card */}
      {!loading && !error && (
        <Card className="dark:bg-[#2c2c2e] dark:border-gray-700 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <Coins className="h-5 w-5 text-yellow-500" />
              Top 10 Contributors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {leaderboard.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                No users yet. Be the first to upload a book!
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 transition-colors ${getRankBackground(
                      entry.rank,
                    )}`}
                  >
                    {/* Rank */}
                    <div className="shrink-0 w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                          {entry.full_name}
                        </span>
                        {getBadgeIcon(entry.badge)}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm shrink-0">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <BookOpen className="h-4 w-4" />
                        <span>{entry.books_uploaded}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-yellow-600 dark:text-yellow-400">
                        <Coins className="h-4 w-4" />
                        <span>{entry.credits}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="mt-6 bg-blue-50/70 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-5">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">
            How Credits Work
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              Every new user starts with 1 credit
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              Upload a book to earn +1 credit
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              Borrowing freezes 1 credit until you return
            </li>
          </ul>

          <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mt-4 mb-2">
            Badge Tiers
          </h3>
          <div className="flex flex-wrap gap-4 text-xs text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-gray-400" />
              <span>Novice (1-4)</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-blue-500" />
              <span>Librarian (5-19)</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>Community Pillar (20+)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

export default LeaderboardPage;
