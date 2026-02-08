/**
 * User Sync Service
 * 
 * Extracted from bookService.ts to break the dependency chain:
 * AuthContext → bookService (991 lines) → api, cache, types
 * 
 * Now: AuthContext → userSyncService (tiny) → api, types
 * This removes ~40KB from the Navbar/initial bundle since AuthContext
 * no longer pulls in the entire bookService.
 */
import { apiGet, apiPost } from './api';
import type { User, UserStats } from '../types';

// ============================================
// Response Types
// ============================================

interface UserData {
  id: string;
  username: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

interface SyncUserResponse {
  success: boolean;
  data: UserData;
}

interface StatsData {
  books_listed: number;
  books_sold: number;
  books_borrowed: number;
  credits?: {
    total: number;
    available: number;
    frozen: number;
  };
  badge?: {
    name: 'Novice' | 'Librarian' | 'Community Pillar';
    color: 'gray' | 'blue' | 'gold';
  };
}

interface GetStatsResponse {
  success: boolean;
  data: StatsData;
}

// ============================================
// Service Functions
// ============================================

/** POST /users/sync - Sync Supabase auth user to local users table */
export async function syncUser(): Promise<User> {
  try {
    const response = await apiPost<SyncUserResponse>('/users/sync', {});
    return {
      id: response.data.id,
      username: response.data.username,
      fullName: response.data.full_name,
      email: response.data.email,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  } catch (error) {
    console.error('Sync user error:', error);
    throw error;
  }
}

/** GET /users/me/stats - Get current user's activity statistics including credits */
export async function getUserStats(): Promise<UserStats> {
  try {
    const response = await apiGet<GetStatsResponse>('/users/me/stats');
    return {
      booksListed: response.data.books_listed,
      booksSold: response.data.books_sold,
      booksBorrowed: response.data.books_borrowed,
      credits: response.data.credits,
      badge: response.data.badge,
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    throw error;
  }
}
