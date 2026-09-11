import { memo, useMemo } from "react";
import {
  Compass,
  CheckCircle2,
  BookOpen,
  Calendar,
  Users,
  Clock,
  Sparkles,
  BookmarkCheck,
} from "lucide-react";
import type { BookJourneyRecord } from "../types";

interface BookJourneyTimelineProps {
  journey?: BookJourneyRecord[];
  isBorrowed?: boolean;
  borrowerName?: string | null;
  dueAt?: string | null;
}

/** Formats an ISO date string into a friendly "Mon DD, YYYY" format */
function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** Generates a consistent subtle gradient based on user name for avatar initials */
function getAvatarGradient(name: string): string {
  const gradients = [
    "from-amber-500 to-orange-600",
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-rose-500 to-red-600",
    "from-cyan-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export const BookJourneyTimeline = memo(function BookJourneyTimeline({
  journey = [],
  isBorrowed = false,
  borrowerName,
  dueAt,
}: BookJourneyTimelineProps) {
  // Compute reader stats
  const stats = useMemo(() => {
    // Distinct readers
    const names = new Set<string>();
    let totalDays = 0;
    let completedCount = 0;

    journey.forEach((item) => {
      if (item.borrowerName) names.add(item.borrowerName);
      if (item.status === "returned" && item.durationDays) {
        totalDays += item.durationDays;
        completedCount++;
      }
    });

    const avgDays =
      completedCount > 0 ? Math.round(totalDays / completedCount) : null;

    return {
      totalReaders: names.size,
      avgDays,
    };
  }, [journey]);

  // Separate active borrow from past completed borrows
  const activeRecord = journey.find((item) => item.status === "borrowed" || item.status === "overdue");
  const pastRecords = journey.filter((item) => item.status === "returned");

  const hasAnyHistory = journey.length > 0;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-black dark:text-white">
              Community Reading Journey
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track this copy's journey as it travels hand-to-hand among club members.
          </p>
        </div>

        {/* Social Proof Stats Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {stats.totalReaders > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
              <Users className="w-3.5 h-3.5" />
              <span>
                {stats.totalReaders} {stats.totalReaders === 1 ? "Reader" : "Readers"}
              </span>
            </div>
          )}

          {stats.avgDays !== null && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
              <Clock className="w-3.5 h-3.5" />
              <span>Avg. read: {stats.avgDays} days</span>
            </div>
          )}

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isBorrowed
                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
            }`}
          >
            {isBorrowed ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Currently Borrowed</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Available on Shelf</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 rounded-2xl p-5 md:p-7 shadow-sm">
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-3 sm:before:left-4 before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-gray-300 dark:before:via-gray-700 before:to-transparent">
          {/* Node 1: Current Live State */}
          <div className="relative">
            {/* Timeline node icon */}
            <div className="absolute -left-6 sm:-left-8 top-1">
              {isBorrowed ? (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-amber-100 dark:ring-amber-950/70 shadow-md">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-emerald-100 dark:ring-emerald-950/70 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Current State Content Card */}
            <div
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isBorrowed
                  ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                  : "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                  {isBorrowed
                    ? `Currently with ${activeRecord?.borrowerName || borrowerName || "a Club Member"}`
                    : "Available on Shelf"}
                </h4>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {isBorrowed
                    ? activeRecord?.borrowedAt
                      ? `Since ${formatDate(activeRecord.borrowedAt)}`
                      : "In progress"
                    : "Ready for you"}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {isBorrowed
                  ? dueAt
                    ? `Expected return by ${formatDate(dueAt)}.`
                    : "Expected to return once the reader finishes."
                  : "This copy is available to borrow. Click 'Borrow Book' above to begin reading."}
              </p>
            </div>
          </div>

          {/* Past Reader Nodes */}
          {pastRecords.map((record) => {
            const initial = record.borrowerName ? record.borrowerName.charAt(0).toUpperCase() : "?";
            const gradient = getAvatarGradient(record.borrowerName);

            return (
              <div key={record.id} className="relative group">
                {/* Timeline node marker */}
                <div className="absolute -left-6 sm:-left-8 top-2">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr ${gradient} text-white font-bold text-xs flex items-center justify-center shadow-sm ring-4 ring-white dark:ring-gray-900`}
                  >
                    {initial}
                  </div>
                </div>

                {/* History Card */}
                <div className="p-4 rounded-xl bg-gray-50/90 dark:bg-gray-800/40 border border-gray-200/70 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {record.borrowerName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> Returned
                      </span>
                    </div>

                    {record.durationDays && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
                        Read in {record.durationDays} {record.durationDays === 1 ? "day" : "days"}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Borrowed: {formatDate(record.borrowedAt)}</span>
                    </div>
                    {record.returnedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Returned: {formatDate(record.returnedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* First-time Reader Empty State */}
          {!hasAnyHistory && !isBorrowed && (
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-dashed border-amber-300 dark:border-amber-800/50 text-center sm:text-left">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                🌱 Be the first reader to begin this book's community journey!
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Every book tells a story through the readers who hold it. Your read will be stamped here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
