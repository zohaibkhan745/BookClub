from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.db.database import engine, Base
from app.cache import get_cache_stats
import os

# Import all models to ensure they're registered with Base.metadata
from app.models import User, Book, BorrowRecord

# Import API routers
from app.api import books_new as books
from app.api import borrow_new as borrow
from app.api import users

# Create database tables (for development - use Alembic migrations in production)
# Note: This won't modify existing tables, only create new ones
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Book Club API",
    description="API for the Book Club community platform",
    version="2.0.0",  # Version bump for schema refactor
)

# GZip compression for responses > 1KB (reduces bandwidth significantly)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS origins - includes localhost for dev and production domains
cors_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
]

# Add production frontend URL from environment if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
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
    return {"status": "healthy", "service": "book-club-api", "version": "2.0.0"}


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
