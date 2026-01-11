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
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-red-400 mb-4">
        <AlertTriangle className="w-16 h-16" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">{message}</p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Try Again
          </button>
        )}
        {showHomeLink && (
          <Link
            to="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Return Home
          </Link>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
