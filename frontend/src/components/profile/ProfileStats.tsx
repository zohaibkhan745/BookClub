/**
 * ProfileStats Component
 * Displays user activity statistics in a clean card layout.
 */

import { BookOpen, ShoppingBag, BookMarked } from "lucide-react";
import type { UserStats } from "../../types";

interface ProfileStatsProps {
  stats: UserStats;
  isLoading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#2c2c2e] rounded-xl shadow-sm">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#2c2c2e] rounded-xl shadow-sm animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div>
        <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

export function ProfileStats({ stats, isLoading }: ProfileStatsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Activity Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Activity Summary
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<BookOpen className="w-6 h-6 text-amber-600" />}
          label="Books Listed"
          value={stats.booksListed}
          color="bg-amber-100 dark:bg-amber-900/30"
        />
        <StatCard
          icon={<ShoppingBag className="w-6 h-6 text-green-600" />}
          label="Books Sold"
          value={stats.booksSold}
          color="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          icon={<BookMarked className="w-6 h-6 text-blue-600" />}
          label="Books Borrowed"
          value={stats.booksBorrowed}
          color="bg-blue-100 dark:bg-blue-900/30"
        />
      </div>
    </div>
  );
}
