import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
  fullScreen?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load the content. Please try again.",
  onRetry,
  showHomeLink = true,
  fullScreen = false,
}: ErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-red-500 mb-4">
        <AlertTriangle className="w-16 h-16" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-5 py-2.5 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition shadow-sm cursor-pointer"
          >
            Try Again
          </button>
        )}
        {showHomeLink && (
          <Link
            to="/"
            className="px-5 py-2.5 bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-200 font-medium rounded-xl hover:bg-black/10 dark:hover:bg-white/15 transition"
          >
            Return Home
          </Link>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] text-foreground flex items-center justify-center transition-colors duration-300">
        {content}
      </div>
    );
  }

  return content;
}
