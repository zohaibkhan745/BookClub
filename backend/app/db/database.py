from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

# Create SQLAlchemy engine with optimized connection pool settings
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # Verify connection before using
    pool_size=10,  # Increased from 5 for better concurrency
    max_overflow=20,  # Increased from 10 for burst capacity
    pool_timeout=30,  # Wait up to 30s for a connection
    pool_recycle=1800,  # Recycle connections after 30 minutes
    echo=False,  # Set to True for SQL query logging (debug only)
)

# Session factory with optimized settings
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Prevents re-fetching after commit
)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
