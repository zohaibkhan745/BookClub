from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api import books, borrow

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Book Club API",
    description="API for the Book Club community platform",
    version="1.0.0",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "book-club-api"}


# Register API routers
app.include_router(books.router)
app.include_router(borrow.router)
