import { useState, useEffect } from "react";
import { getLeaderboard } from "../services";
import type { LeaderboardEntry } from "../types";
import {
  Trophy,
  Medal,
  Award,
  Coins,
  BookOpen,
  Loader2,
  Crown,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

/**
 * LeaderboardPage - Shows top users ranked by total credits.
 * Features:
 * - Top 3 with special styling (gold, silver, bronze)
 * - Badge tier icons
 * - Books uploaded count
 */
export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard(10);
        setLeaderboard(data);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        setError("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-500">
            {rank}
          </span>
        );
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
      default:
        return "bg-white border-gray-100 hover:bg-gray-50";
    }
  };

  const getBadgeIcon = (badge: LeaderboardEntry["badge"]) => {
    switch (badge.color) {
      case "gold":
        return <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
      case "blue":
        return <Award className="h-5 w-5 text-blue-500" />;
      default:
        return <Award className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
            </div>
            <p className="text-gray-600">
              Top contributors ranked by credits earned
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-6 text-center text-red-600">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Leaderboard */}
          {!loading && !error && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Top 10 Contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {leaderboard.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    No users yet. Be the first to upload a book!
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-4 p-4 transition-colors ${getRankBackground(entry.rank)}`}
                      >
                        {/* Rank */}
                        <div className="flex-shrink-0 w-10 flex justify-center">
                          {getRankIcon(entry.rank)}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 truncate">
                              {entry.full_name}
                            </span>
                            {getBadgeIcon(entry.badge)}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{entry.username}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm">
                          {/* Books Uploaded */}
                          <div className="flex items-center gap-1 text-gray-500">
                            <BookOpen className="h-4 w-4" />
                            <span>{entry.books_uploaded}</span>
                          </div>

                          {/* Credits */}
                          <div className="flex items-center gap-1 font-semibold text-yellow-600">
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
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                How Credits Work
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Every new user starts with 1 credit
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Upload a book to earn +1 credit
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Borrowing freezes 1 credit until you return
                </li>
              </ul>

              <h3 className="font-semibold text-blue-900 mt-4 mb-2">
                Badge Tiers
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-blue-800">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
