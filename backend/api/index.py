"""
Vercel serverless entry point for FastAPI
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import the FastAPI app
from app.main import app

# Export for Vercel - this is the ASGI application
# Vercel's Python runtime will use this directly
