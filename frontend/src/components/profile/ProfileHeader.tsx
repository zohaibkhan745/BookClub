/**
 * ProfileHeader Component
 * Displays user avatar (initials-based), name, email, and join date.
 */

interface ProfileHeaderProps {
  fullName: string;
  email: string;
  username: string;
  createdAt?: string;
}

/** Generate initials from full name (max 2 characters) */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Format date to readable string */
function formatJoinDate(dateString?: string): string {
  if (!dateString) return "Recently joined";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function ProfileHeader({
  fullName,
  email,
  username,
  createdAt,
}: ProfileHeaderProps) {
  const initials = getInitials(fullName || "U");

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-sm">
      {/* Avatar with initials */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
        {initials}
      </div>

      {/* User info */}
      <div className="text-center sm:text-left flex-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {fullName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">@{username}</p>
        <p className="text-gray-600 dark:text-gray-300 mt-2">{email}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Member since {formatJoinDate(createdAt)}
        </p>
      </div>
    </div>
  );
}
