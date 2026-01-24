from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Make database optional for serverless cold starts
    database_url: str = "sqlite:///./test.db"  # Default for testing/cold start
    env: str = "development"
    
    # Supabase Auth settings - optional for graceful degradation
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    supabase_anon_key: str = ""  # For JWKS endpoint access
    supabase_service_key: str = ""  # For server-side Storage uploads (optional)
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
