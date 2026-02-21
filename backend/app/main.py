from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import asyncio
import os

# Import cache stats and cleanup
from app.cache import get_cache_stats, cache

# Try to initialize database (may fail in serverless cold start)
try:
    from app.db.database import engine, Base
    # Import all models to ensure they're registered with Base.metadata
    from app.models import User, Book, BorrowRecord, ForumThread, ForumReply, Subscriber
    
    # Create database tables (for development - use Alembic migrations in production)
    # Note: This won't modify existing tables, only create new ones
    Base.metadata.create_all(bind=engine)
    db_initialized = True
except Exception as e:
    print(f"Warning: Database initialization failed: {e}")
    db_initialized = False

# Import API routers
from app.api import books
from app.api import borrow
from app.api import users
from app.api import forum
from app.api import subscribers


# Background task for periodic cache cleanup
async def cache_cleanup_task():
    """Periodically clean up expired cache entries to prevent memory bloat."""
    while True:
        await asyncio.sleep(300)  # Every 5 minutes
        removed = cache.cleanup_expired()
        if removed > 0:
            print(f"Cache cleanup: removed {removed} expired entries")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events."""
    # Startup: Start background cache cleanup task
    cleanup_task = asyncio.create_task(cache_cleanup_task())
    yield
    # Shutdown: Cancel cleanup task
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Book Club API",
    description="API for the Book Club community platform",
    version="2.0.0",  # Version bump for schema refactor
    lifespan=lifespan,
)

# GZip compression for responses > 1KB (reduces bandwidth significantly)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS origins - includes localhost for dev and production domains
cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://book-club.social",
    "https://www.book-club.social",
    "https://book-club-giki.vercel.app",
]

# Add production frontend URL from environment if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in cors_origins:
    cors_origins.append(frontend_url)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy", 
        "service": "book-club-api", 
        "version": "2.0.0",
        "database": "connected" if db_initialized else "not_configured"
    }


@app.get("/cache/stats")
async def cache_stats():
    """
    Cache statistics endpoint for monitoring.
    Returns hit/miss counts and hit rate percentage.
    """
    return get_cache_stats()


# Register API routers
app.include_router(books.router)
app.include_router(borrow.router)
app.include_router(users.router)
app.include_router(forum.router)
app.include_router(subscribers.router)
