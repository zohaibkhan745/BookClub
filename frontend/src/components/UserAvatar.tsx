import { useMemo } from "react";

interface UserAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * UserAvatar - Displays user initials in a colored circle.
 *
 * Extracts first letter of first and last name to create initials.
 * Uses consistent color based on the name for visual recognition.
 */
export function UserAvatar({
  name,
  size = "md",
  className = "",
}: UserAvatarProps) {
  // Extract initials from name
  const initials = useMemo(() => {
    if (!name) return "?";

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    // First letter of first name + first letter of last name
    const first = parts[0].charAt(0).toUpperCase();
    const last = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${first}${last}`;
  }, [name]);

  // Generate consistent color based on name
  const colorClasses = useMemo(() => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
      "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
    ];

    // Simple hash of name to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }, [name]);

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClasses}
        rounded-full flex items-center justify-center font-bold
        flex-shrink-0 select-none
        ${className}
      `}
      title={name}
    >
      {initials}
    </div>
  );
}

export default UserAvatar;
