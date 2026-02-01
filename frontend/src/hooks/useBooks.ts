/**
 * SWR-based hooks for book data fetching with automatic caching,
 * deduplication, and background revalidation.
 */
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { apiGet } from '../services/api';
import type { Book, BookPreview } from '../types';

// ============================================
// SWR Configuration
// ============================================

const swrConfig = {
  revalidateOnFocus: false,      // Don't refetch on window focus
  revalidateOnReconnect: true,   // Refetch on network reconnect
  dedupingInterval: 10000,       // Dedupe requests within 10 seconds
  errorRetryCount: 2,            // Retry failed requests twice
};

// ============================================
// API Response Types
// ============================================

interface BookSectionsResponse {
  success: boolean;
  data: {
    trending: BookPreview[];
    newArrivals: BookPreview[];
    popular: BookPreview[];
  };
}

interface BookDetailResponse {
  success: boolean;
  data: Book;
}

interface LibraryResponse {
  success: boolean;
  data: {
    uploaded: BookPreview[];
    borrowed: BookPreview[];
  };
}

interface GenreBooksResponse {
  success: boolean;
  data: BookPreview[];
}

interface AllBooksResponse {
  success: boolean;
  data: BookPreview[];
  pagination?: {
    next_cursor: number | null;
    has_next: boolean;
    limit: number;
  };
}

// ============================================
// SWR Fetcher
// ============================================

const fetcher = <T>(url: string) => apiGet<T>(url);

// ============================================
// Hooks
// ============================================

/**
 * Fetch homepage book sections (trending, new arrivals, popular)
 * Uses SWR for automatic caching and background revalidation
 */
export function useBookSections(limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR<BookSectionsResponse>(
    `/books/sections?limit=${limit}`,
    fetcher,
    {
      ...swrConfig,
      revalidateIfStale: true,
      revalidateOnMount: true,
    }
  );

  return {
    sections: data?.data,
    isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  };
}

/**
 * Fetch a single book by ID
 * Uses SWRImmutable for data that rarely changes (book details)
 */
export function useBook(bookId: string | number | undefined) {
  const { data, error, isLoading, mutate } = useSWRImmutable<BookDetailResponse>(
    bookId ? `/books/${bookId}` : null,
    fetcher,
    swrConfig
  );

  return {
    book: data?.data,
    isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  };
}

/**
 * Fetch user's library (uploaded and borrowed books)
 * Shorter cache for more dynamic data
 */
export function useLibrary() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LibraryResponse>(
    '/user/library',
    fetcher,
    {
      ...swrConfig,
      dedupingInterval: 5000,        // Shorter dedup for library
      revalidateIfStale: true,
    }
  );

  return {
    uploaded: data?.data?.uploaded || [],
    borrowed: data?.data?.borrowed || [],
    isLoading,
    isRefreshing: isValidating && !isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  };
}

/**
 * Fetch books by genre/category
 */
export function useGenreBooks(genre: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<GenreBooksResponse>(
    genre ? `/books/genre/${encodeURIComponent(genre)}` : null,
    fetcher,
    swrConfig
  );

  return {
    books: data?.data || [],
    isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  };
}

/**
 * Fetch all books for the homepage grid
 */
export function useAllBooks(limit: number = 50) {
  const { data, error, isLoading, mutate } = useSWR<AllBooksResponse>(
    `/books/all?limit=${limit}`,
    fetcher,
    {
      ...swrConfig,
      revalidateIfStale: true,
      revalidateOnMount: true,
    }
  );

  return {
    books: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error: error?.message || null,
    refresh: () => mutate(),
  };
}

/**
 * Prefetch a book's data (for hover preloading)
 */
export function prefetchBook(bookId: string | number) {
  return apiGet<BookDetailResponse>(`/books/${bookId}`);
}

/**
 * Invalidate and refetch all book-related data
 */
export function invalidateBookCache() {
  // SWR will automatically revalidate when components remount
  // This is handled by the mutate function in individual hooks
}
