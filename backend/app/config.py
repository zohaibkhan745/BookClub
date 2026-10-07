from pydantic_settings import BaseSettings, SettingsConfigDict
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
    
    # Cloudflare R2 Storage settings
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "books-images"
    r2_public_domain: str = ""  # e.g., https://pub-xxxx.r2.dev or https://cdn.yourdomain.com
    
    # Admin security key for sensitive/maintenance tasks
    admin_secret_key: str = ""
    
    # Web Push (VAPID) settings for iOS and Android notifications
    vapid_public_key: str = "BHJiRNf7Fl5mjqSiQrQjYoMT2Pwg_kwHeA_qCO2vn-93-FzYtQfA_sz3Cue1KCLApf8BXZ-E0cqwqYK6ci0MEc0"
    vapid_private_key: str = "fK0MMC4pjzsvNwkG7L4x76kD4mflDoZPRSqAGhN9-Kw"
    vapid_claims_sub: str = "mailto:admin@bookclub.giki.edu.pk"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
