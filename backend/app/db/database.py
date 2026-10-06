from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool, QueuePool
from app.config import get_settings

import os

settings = get_settings()

# Determine if we should use NullPool for serverless environments (e.g., Vercel Lambda).
# In serverless environments, maintaining connection pools exhausts database connections and crashes invocations.
is_serverless = (
    settings.env in ("production", "serverless")
    or os.getenv("VERCEL") == "1"
    or bool(os.getenv("VERCEL_REGION"))
    or bool(os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
)

poolclass = NullPool if is_serverless else QueuePool

# Disable GSSAPI encryption negotiation for PostgreSQL (avoids timeout against PgBouncer/Supabase)
connect_args = {}
if settings.database_url.startswith("postgres"):
    connect_args["gssencmode"] = "disable"

# Create SQLAlchemy engine with optimized connection pool settings
engine_kwargs = {
    "pool_pre_ping": True,  # Verify connection before using
    "echo": False,  # Set to True for SQL query logging (debug only)
    "poolclass": poolclass,
    "connect_args": connect_args,
}

if not is_serverless:
    engine_kwargs.update({
        "pool_size": 10,  # Connection pool size for reuse
        "max_overflow": 20,  # Max overflow for burst capacity
        "pool_timeout": 30,  # Wait up to 30s for a connection
        "pool_recycle": 300,  # Recycle connections every 5 minutes to prevent PgBouncer drops
    })

engine = create_engine(
    settings.database_url,
    **engine_kwargs
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
