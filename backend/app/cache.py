"""
Simple in-memory cache for API responses.
Provides significant performance improvement for frequently accessed data.
"""
from datetime import datetime, timedelta
from typing import Any, Optional
from functools import wraps
import hashlib
import json
import logging

import threading
from collections import OrderedDict

logger = logging.getLogger(__name__)

# Default maximum number of cached items to prevent memory exhaustion (DoS mitigation)
DEFAULT_MAX_CACHE_ENTRIES = 2000


class SimpleCache:
    """Thread-safe bounded in-memory cache with LRU eviction and TTL support."""
    
    def __init__(self, max_entries: int = DEFAULT_MAX_CACHE_ENTRIES):
        self._cache: OrderedDict[str, tuple[Any, datetime]] = OrderedDict()
        self._default_ttl = timedelta(seconds=60)
        self._max_entries = max_entries
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0
        self._evictions = 0
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired, moving accessed key to end (LRU)."""
        with self._lock:
            if key in self._cache:
                value, expiry = self._cache[key]
                if datetime.now() < expiry:
                    self._hits += 1
                    # Move to end to mark as recently used
                    self._cache.move_to_end(key)
                    return value
                else:
                    # Clean up expired entry
                    del self._cache[key]
            self._misses += 1
            return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 60) -> None:
        """Set value in cache with TTL, enforcing maximum size via LRU eviction."""
        expiry = datetime.now() + timedelta(seconds=ttl_seconds)
        with self._lock:
            if key in self._cache:
                self._cache[key] = (value, expiry)
                self._cache.move_to_end(key)
                return

            # Check if cache is full - first purge expired items
            if len(self._cache) >= self._max_entries:
                self._purge_expired_locked()

            # If still at capacity, evict least recently used (first item)
            while len(self._cache) >= self._max_entries:
                self._cache.popitem(last=False)
                self._evictions += 1

            self._cache[key] = (value, expiry)
    
    def delete(self, key: str) -> None:
        """Delete a specific key from cache."""
        with self._lock:
            self._cache.pop(key, None)
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching a pattern (prefix match). Returns count invalidated."""
        with self._lock:
            keys_to_delete = [k for k in self._cache.keys() if k.startswith(pattern)]
            for key in keys_to_delete:
                del self._cache[key]
            return len(keys_to_delete)
    
    def clear(self) -> None:
        """Clear all cached data."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
            self._evictions = 0
    
    def _purge_expired_locked(self) -> int:
        """Internal helper to purge expired entries while lock is held."""
        now = datetime.now()
        expired_keys = [k for k, (_, expiry) in self._cache.items() if now >= expiry]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)

    def cleanup_expired(self) -> int:
        """Remove all expired entries. Returns count of removed entries."""
        with self._lock:
            return self._purge_expired_locked()
    
    def stats(self) -> dict:
        """Get cache statistics."""
        with self._lock:
            total = self._hits + self._misses
            hit_rate = (self._hits / total * 100) if total > 0 else 0
            return {
                "hits": self._hits,
                "misses": self._misses,
                "evictions": self._evictions,
                "hit_rate": f"{hit_rate:.1f}%",
                "entries": len(self._cache),
                "max_entries": self._max_entries,
            }


# Global cache instance
cache = SimpleCache()


def make_cache_key(*args, **kwargs) -> str:
    """Generate a cache key from function arguments."""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()


def cached(prefix: str, ttl_seconds: int = 30):
    """
    Decorator to cache function results.
    
    Usage:
        @cached("books_sections", ttl_seconds=30)
        def get_books_by_section(db, limit=10):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Skip db session from cache key (first arg is typically db)
            cache_args = args[1:] if args else ()
            key = f"{prefix}:{make_cache_key(*cache_args, **kwargs)}"
            
            # Try to get from cache
            cached_value = cache.get(key)
            if cached_value is not None:
                return cached_value
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(key, result, ttl_seconds)
            return result
        
        return wrapper
    return decorator


def invalidate_books_cache():
    """Invalidate all book-related caches. Call after any book mutation."""
    count = cache.invalidate_pattern("books")
    count += cache.invalidate_pattern("genre")
    count += cache.invalidate_pattern("user_library")
    logger.debug(f"Invalidated {count} cache entries")


def invalidate_user_cache(user_id: str):
    """Invalidate cache for a specific user (uploaded and borrowed books)."""
    # Invalidate user:{user_id}:books:* (uploaded books cache)
    # Invalidate user:{user_id}:borrowed:* (borrowed books cache)
    cache.invalidate_pattern(f"user:{user_id}")


def get_cache_stats() -> dict:
    """Get cache statistics for monitoring."""
    return cache.stats()
