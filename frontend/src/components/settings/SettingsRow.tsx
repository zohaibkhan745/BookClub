/**
 * SettingsRow Component
 * Individual setting row with label, description, and action.
 */

interface SettingsRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SettingsRow({
  label,
  description,
  children,
  disabled,
}: SettingsRowProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
