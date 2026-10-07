import { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CheckCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../services';
import type { NotificationItem } from '../types';

interface NotificationBellProps {
  isMobile?: boolean;
}

export const NotificationBell = memo(function NotificationBell({
  isMobile = false,
}: NotificationBellProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click or Escape key press
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead && isAuthenticated) {
      markAsRead(item.id);
    }
    setIsOpen(false);

    if (item.bookSlug) {
      navigate(`/book/${item.bookSlug}`);
    } else if (item.bookId) {
      navigate(`/book/${item.bookId}`);
    } else {
      navigate('/library');
    }
  };

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthenticated && unreadCount > 0) {
      await markAllAsRead();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="notifications-dropdown"
        aria-label={
          isAuthenticated && unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        title="Notifications"
      >
        <Bell className="w-5 h-5 transition-transform hover:scale-105" />

        {/* Unread badge count - shown only for authenticated users */}
        {isAuthenticated && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full shadow-sm ring-2 ring-white dark:ring-[#1C1C1E] animate-in zoom-in-75 duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="notifications-dropdown"
          role="dialog"
          aria-label="Notifications"
          className={`absolute ${
            isMobile ? 'right-[-40px]' : 'right-0'
          } mt-2 w-80 sm:w-96 max-w-[90vw] bg-[#FAF7EE] dark:bg-[#2c2c2e] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-white text-base">
                Notifications
              </span>
              {isAuthenticated && unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-medium rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {isAuthenticated && unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Notifications Feed */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-black/5 dark:divide-white/5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {isLoading && notifications.length === 0 ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="flex space-x-3 animate-pulse">
                    <div className="w-12 h-16 bg-black/10 dark:bg-white/10 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-black/5 dark:bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-1">
                  <Sparkles className="w-6 h-6 text-amber-500/80" />
                </div>
                <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  All caught up!
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px]">
                  When members upload new books to the club, you'll be notified here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`w-full text-left px-4 py-3 flex items-start space-x-3 transition cursor-pointer group focus:outline-none focus-visible:bg-black/10 dark:focus-visible:bg-white/10 ${
                    !item.isRead
                      ? 'bg-red-500/[0.04] dark:bg-red-500/[0.08] hover:bg-red-500/[0.08] dark:hover:bg-red-500/[0.14]'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {/* Book Thumbnail / Icon */}
                  <div className="w-11 h-15 rounded-lg overflow-hidden flex-shrink-0 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-xs flex items-center justify-center">
                    {item.bookCover ? (
                      <img
                        src={item.bookCover}
                        alt="Book cover"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <BookOpen className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug line-clamp-2">
                      {item.message}
                    </p>

                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {item.createdAt ? formatRelativeTime(item.createdAt) : 'recently'}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600">•</span>
                      <span className="text-[11px] text-red-600 dark:text-red-400 font-medium group-hover:underline flex items-center gap-0.5">
                        View Book
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </span>
                    </div>
                  </div>

                  {/* Unread dot indicator */}
                  {!item.isRead && (
                    <div className="pt-2">
                      <span className="block w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs ring-2 ring-white dark:ring-[#2c2c2e]" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/library');
              }}
              className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
            >
              Browse all library books →
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
