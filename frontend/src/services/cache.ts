/**
 * Simple client-side cache with TTL support.
 * Caches API responses to reduce network requests and improve perceived performance.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class ClientCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 30000; // 30 seconds

  /**
   * Get cached value if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * Delete specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats (for debugging)
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const clientCache = new ClientCache();

// Cache keys
export const CACHE_KEYS = {
  BOOK_SECTIONS: 'books:sections',
  BOOK_DETAIL: (id: number) => `books:detail:${id}`,
  GENRE_BOOKS: (genre: string) => `books:genre:${genre}`,
  LIBRARY_BOOKS: 'books:library',
  STORE_BOOKS: 'books:store',
  SEARCH_RESULTS: (query: string) => `search:${query}`,
  USER_STATS: 'user:stats',
} as const;

// TTL values in milliseconds
export const CACHE_TTL = {
  SHORT: 15000,    // 15 seconds - for frequently changing data
  MEDIUM: 30000,   // 30 seconds - for book listings
  LONG: 60000,     // 1 minute - for single book details
  SEARCH: 10000,   // 10 seconds - for search results
} as const;
