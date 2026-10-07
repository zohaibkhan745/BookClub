import { apiGet, apiPost } from './api';
import type { NotificationItem, NotificationListResponse, MarkReadResponse } from '../types';

/** Convert snake_case backend notification to camelCase frontend interface */
function transformNotification(raw: NotificationListResponse['data'][0]): NotificationItem {
  return {
    id: raw.id,
    userId: raw.user_id,
    actorId: raw.actor_id,
    actorName: raw.actor_name,
    type: raw.type,
    title: raw.title,
    message: raw.message,
    bookId: raw.book_id,
    bookSlug: raw.book_slug,
    bookCover: raw.book_cover,
    createdAt: raw.created_at,
    isRead: raw.is_read,
  };
}

/**
 * Fetch recent notifications and unread count.
 */
export async function getNotifications(
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  const query = new URLSearchParams({
    limit: limit.toString(),
    unread_only: unreadOnly ? 'true' : 'false',
  });

  const response = await apiGet<NotificationListResponse>(`/notifications?${query.toString()}`);
  return {
    notifications: (response.data || []).map(transformNotification),
    unreadCount: response.unread_count || 0,
  };
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(id: number): Promise<MarkReadResponse> {
  return apiPost<MarkReadResponse>(`/notifications/${id}/read`, {});
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead(): Promise<MarkReadResponse> {
  return apiPost<MarkReadResponse>('/notifications/read-all', {});
}

/**
 * Fetch VAPID public key from backend for Web Push subscription.
 */
export async function getVapidPublicKey(): Promise<string> {
  const response = await apiGet<{ success: boolean; data: { public_key: string } }>(
    '/notifications/push/public-key'
  );
  return response.data.public_key;
}

/**
 * Register device Web Push subscription on the backend.
 */
export async function registerPushSubscription(
  subscription: PushSubscriptionJSON,
  userAgent?: string
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>('/notifications/push/subscribe', {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys?.p256dh,
      auth: subscription.keys?.auth,
    },
    user_agent: userAgent || navigator.userAgent,
  });
}

/**
 * Unregister device Web Push subscription on the backend.
 */
export async function unregisterPushSubscription(
  endpoint: string
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>('/notifications/push/unsubscribe', {
    endpoint,
  });
}

/**
 * Check if the device/user is subscribed to push notifications.
 */
export async function checkPushStatus(
  endpoint?: string
): Promise<{ success: boolean; isSubscribed: boolean }> {
  const query = endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : '';
  const response = await apiGet<{ success: boolean; is_subscribed: boolean }>(
    `/notifications/push/status${query}`
  );
  return {
    success: response.success,
    isSubscribed: response.is_subscribed,
  };
}

/**
 * Send an immediate test push notification to verify lock screen alerts.
 */
export async function sendTestPushNotification(
  endpoint?: string
): Promise<{ success: boolean; sentCount: number; message: string }> {
  const query = endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : '';
  const response = await apiPost<{ success: boolean; sent_count: number; message: string }>(
    `/notifications/push/test${query}`,
    {}
  );
  return {
    success: response.success,
    sentCount: response.sent_count,
    message: response.message,
  };
}
