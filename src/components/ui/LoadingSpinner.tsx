import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function LoadingSpinner({
  message = "Loading...",
  size = "md",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className="text-center">
      <Loader2
        className={`${sizeClasses[size]} text-amber-500 animate-spin mx-auto mb-3`}
      />
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">{content}</div>
  );
}
