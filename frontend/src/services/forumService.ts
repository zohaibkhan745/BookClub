/**
 * Forum Service
 * API functions for community forum threads and replies.
 */

import { apiGet, apiPost, apiDelete } from './api';

// ============================================
// Types
// ============================================

export interface ForumAuthor {
  id: string;
  full_name: string;
  username: string;
}

export interface ForumReply {
  id: number;
  content: string;
  author: ForumAuthor;
  created_at: string;
}

export interface ForumThread {
  id: number;
  title: string;
  content: string;
  author: ForumAuthor;
  reply_count: number;
  created_at: string;
}

export interface ForumThreadDetail {
  id: number;
  title: string;
  content: string;
  author: ForumAuthor;
  replies: ForumReply[];
  created_at: string;
}

interface ThreadsResponse {
  success: boolean;
  data: ForumThread[];
  total: number;
}

interface ThreadDetailResponse {
  success: boolean;
  data: ForumThreadDetail;
}

interface CreateThreadResponse {
  success: boolean;
  message: string;
  data: ForumThread;
}

interface CreateReplyResponse {
  success: boolean;
  message: string;
  data: ForumReply;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all forum threads
 */
export async function getForumThreads(limit = 50, offset = 0): Promise<{ threads: ForumThread[]; total: number }> {
  const response = await apiGet<ThreadsResponse>(`/forum/threads?limit=${limit}&offset=${offset}`);
  return {
    threads: response.data,
    total: response.total
  };
}

/**
 * Get a single thread with all replies
 */
export async function getThreadDetail(threadId: number): Promise<ForumThreadDetail> {
  const response = await apiGet<ThreadDetailResponse>(`/forum/threads/${threadId}`);
  return response.data;
}

/**
 * Create a new forum thread
 */
export async function createThread(title: string, content: string): Promise<ForumThread> {
  const response = await apiPost<CreateThreadResponse>('/forum/threads', { title, content });
  return response.data;
}

/**
 * Delete a forum thread (only author can delete)
 */
export async function deleteThread(threadId: number): Promise<void> {
  await apiDelete<DeleteResponse>(`/forum/threads/${threadId}`);
}

/**
 * Create a reply on a thread
 */
export async function createReply(threadId: number, content: string): Promise<ForumReply> {
  const response = await apiPost<CreateReplyResponse>(`/forum/threads/${threadId}/replies`, { content });
  return response.data;
}

/**
 * Delete a reply (only author can delete)
 */
export async function deleteReply(replyId: number): Promise<void> {
  await apiDelete<DeleteResponse>(`/forum/replies/${replyId}`);
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  
  return date.toLocaleDateString();
}
