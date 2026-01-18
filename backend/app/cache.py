"""
Simple in-memory cache for API responses.
Provides significant performance improvement for frequently accessed data.
"""
from datetime import datetime, timedelta
from typing import Any, Optional
from functools import wraps
import hashlib
import json


class SimpleCache:
    """Thread-safe simple in-memory cache with TTL support."""
    
    def __init__(self):
        self._cache: dict[str, tuple[Any, datetime]] = {}
        self._default_ttl = timedelta(seconds=30)  # Short TTL for frequently updated data
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired."""
        if key in self._cache:
            value, expiry = self._cache[key]
            if datetime.now() < expiry:
                return value
            else:
                # Clean up expired entry
                del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 30) -> None:
        """Set value in cache with TTL."""
        expiry = datetime.now() + timedelta(seconds=ttl_seconds)
        self._cache[key] = (value, expiry)
    
    def delete(self, key: str) -> None:
        """Delete a specific key from cache."""
        if key in self._cache:
            del self._cache[key]
    
    def invalidate_pattern(self, pattern: str) -> None:
        """Invalidate all keys matching a pattern (prefix match)."""
        keys_to_delete = [k for k in self._cache.keys() if k.startswith(pattern)]
        for key in keys_to_delete:
            del self._cache[key]
    
    def clear(self) -> None:
        """Clear all cached data."""
        self._cache.clear()
    
    def cleanup_expired(self) -> int:
        """Remove all expired entries. Returns count of removed entries."""
        now = datetime.now()
        expired_keys = [k for k, (_, expiry) in self._cache.items() if now >= expiry]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)


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
    cache.invalidate_pattern("books")
    cache.invalidate_pattern("genre")
