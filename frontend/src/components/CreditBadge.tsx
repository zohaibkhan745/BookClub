import { useState } from "react";
import { Coins, Award, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface CreditBadgeProps {
  className?: string;
}

/**
 * CreditBadge - Displays user's available credits in the navbar.
 * Uses cached credits from AuthContext to avoid refetching on every navigation.
 * Shows credit count with color coding:
 * - Green: 2+ credits available
 * - Yellow: 1 credit available
 * - Red: 0 or negative credits
 *
 * Works on both desktop (hover) and mobile (click/tap).
 */
export function CreditBadge({ className = "" }: CreditBadgeProps) {
  const { credits, badge, creditsLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (creditsLoading) {
    return (
      <div className={`flex items-center gap-1 px-2 py-1 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  // Determine color based on available credits
  const getColorClasses = () => {
    if (credits.available >= 2) {
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
    } else if (credits.available === 1) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700";
    } else {
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
    }
  };

  // Badge icon color
  const getBadgeColor = () => {
    if (!badge) return "text-gray-400";
    switch (badge.color) {
      case "gold":
        return "text-yellow-500";
      case "blue":
        return "text-blue-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer transition-all hover:scale-105 active:scale-95 ${getColorClasses()} ${className}`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="View credit details"
        >
          <Coins className="h-4 w-4" />
          <span className="font-medium text-sm">{credits.available}</span>
          {badge && <Award className={`h-4 w-4 ${getBadgeColor()}`} />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-4 z-50"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="space-y-3">
          {/* Badge Title */}
          <div className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white text-base">
            {badge && <Award className={`h-5 w-5 ${getBadgeColor()}`} />}
            {badge?.name || "Novice"}
          </div>

          {/* Credit Details */}
          <div className="text-gray-600 dark:text-gray-300 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Credits:</span>
              <span className="font-semibold text-base">{credits.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Available:</span>
              <span className="font-semibold text-base text-green-600 dark:text-green-400">
                {credits.available}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">In Use (Frozen):</span>
              <span className="font-semibold text-base text-amber-600 dark:text-amber-400">
                {credits.frozen}
              </span>
            </div>
          </div>

          {/* Helper Text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            📚 Upload books to earn credits!
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default CreditBadge;
