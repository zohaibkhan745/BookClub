/**
 * SettingsSection Component
 * Reusable settings section with title and content.
 */

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}

export function SettingsSection({
  title,
  description,
  children,
  danger = false,
}: SettingsSectionProps) {
  return (
    <div
      className={`p-6 rounded-xl ${
        danger
          ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30"
          : "bg-white dark:bg-[#2c2c2e]"
      } shadow-sm`}
    >
      <h2
        className={`text-lg font-semibold mb-1 ${
          danger
            ? "text-red-700 dark:text-red-400"
            : "text-gray-900 dark:text-white"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
