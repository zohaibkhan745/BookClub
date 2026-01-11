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
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-amber-400 mb-4">
        {icon || <BookX className="w-16 h-16" />}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-4">{message}</p>
      {actionLabel && (
        <Link
          to={actionHref}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
