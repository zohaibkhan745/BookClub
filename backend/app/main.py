from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base

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

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "book-club-api", "version": "2.0.0"}


# Register API routers
app.include_router(books.router)
app.include_router(borrow.router)
app.include_router(users.router)
