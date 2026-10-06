/**
 * Confirm Dialog Component
 * A styled, accessible confirmation modal replacing window.confirm and ad-hoc dialogs.
 */

import { ReactNode, useEffect, useRef } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
  isLoading?: boolean;
  icon?: ReactNode;
  variant?: "danger" | "warning" | "success" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loadingText = "Processing...",
  isLoading = false,
  icon,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      cancelRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!isLoading) {
          e.preventDefault();
          onCancel();
        }
      } else if (e.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const displayMessage = message || description;

  const variantConfig = {
    danger: {
      iconBg: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
      defaultIcon: <AlertTriangle className="w-6 h-6" />,
      buttonClass:
        "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white focus:ring-red-500",
    },
    warning: {
      iconBg:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
      defaultIcon: <AlertCircle className="w-6 h-6" />,
      buttonClass:
        "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white focus:ring-yellow-500",
    },
    success: {
      iconBg:
        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      defaultIcon: <CheckCircle className="w-6 h-6" />,
      buttonClass:
        "bg-green-500 hover:bg-green-600 active:bg-green-700 text-white focus:ring-green-500",
    },
    default: {
      iconBg: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300",
      defaultIcon: <AlertCircle className="w-6 h-6" />,
      buttonClass:
        "bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white focus:ring-gray-500",
    },
  };

  const config = variantConfig[variant];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 min-h-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Modal Box */}
      <div
        ref={modalRef}
        className="relative z-10 bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full ${config.iconBg}`}>
            {icon || config.defaultIcon}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3
            id="confirm-dialog-title"
            className="text-xl font-semibold text-gray-900 dark:text-white mb-2"
          >
            {title}
          </h3>
          {displayMessage && (
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {displayMessage}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-xl font-medium transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm ${config.buttonClass}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingText}</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
