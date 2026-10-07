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
