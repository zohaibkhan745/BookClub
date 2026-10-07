import { useCallback, useRef, useEffect } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';
import type { NotificationItem } from '../types';

export const NOTIFICATIONS_CACHE_KEY = 'notifications_feed';

interface NotificationData {
  notifications: NotificationItem[];
  unreadCount: number;
}

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const cacheKey = isAuthenticated && user?.id ? `${NOTIFICATIONS_CACHE_KEY}:${user.id}` : `${NOTIFICATIONS_CACHE_KEY}:guest`;

  const { data, error, isLoading, mutate } = useSWR<NotificationData>(
    cacheKey,
    async () => {
      return await getNotifications(20, false);
    },
    {
      refreshInterval: 30000, // Poll every 30 seconds
      refreshWhenHidden: false, // Stop polling when tab is not active to prevent ghost invocations
      refreshWhenOffline: false,
      revalidateOnFocus: true, // Auto-check when returning to the tab
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }

  );

  const prevUnreadRef = useRef<number | null>(null);

  // Audio or subtle notification effect can be hooked here if needed
  useEffect(() => {
    if (data?.unreadCount !== undefined) {
      prevUnreadRef.current = data.unreadCount;
    }
  }, [data?.unreadCount]);

  /** Mark single notification as read with optimistic UI update */
  const handleMarkAsRead = useCallback(
    async (id: number) => {
      if (!isAuthenticated) return;

      // Optimistic update
      await mutate(
        (current) => {
          if (!current) return current;
          const wasUnread = current.notifications.some(
            (n) => n.id === id && !n.isRead
          );
          return {
            notifications: current.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: wasUnread
              ? Math.max(0, current.unreadCount - 1)
              : current.unreadCount,
          };
        },
        false // Do not immediately revalidate from server
      );

      try {
        await markNotificationAsRead(id);
        mutate(); // Re-sync in background
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        mutate(); // Revert on failure
      }
    },
    [isAuthenticated, mutate]
  );

  /** Mark all notifications as read with optimistic UI update */
  const handleMarkAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;

    // Optimistic update
    await mutate(
      (current) => {
        if (!current) return current;
        return {
          notifications: current.notifications.map((n) => ({
            ...n,
            isRead: true,
          })),
          unreadCount: 0,
        };
      },
      false
    );

    try {
      await markAllNotificationsAsRead();
      mutate();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      mutate();
    }
  }, [isAuthenticated, mutate]);

  const refresh = useCallback(() => {
    return mutate();
  }, [mutate]);

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isError: Boolean(error),
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refresh,
  };
}

/** Utility to invalidate and refresh notifications across components (e.g. after book upload) */
export function invalidateNotifications() {
  globalMutate(
    (key) => typeof key === 'string' && key.startsWith(NOTIFICATIONS_CACHE_KEY),
    undefined,
    { revalidate: true }
  );
}
