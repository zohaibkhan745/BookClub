import { BookX } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title = "Nothing here yet",
  message = "No items to display at the moment.",
  icon,
  actionLabel,
  actionHref = "/",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-amber-500 dark:text-amber-400 mb-4">
        {icon || <BookX className="w-16 h-16" />}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6 leading-relaxed">
        {message}
      </p>
      {actionLabel && (
        <Link
          to={actionHref}
          className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition shadow-sm"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
