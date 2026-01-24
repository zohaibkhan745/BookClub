"""
Vercel serverless entry point for FastAPI
Vercel has native ASGI support - just expose the app directly
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import and expose the FastAPI app
# Vercel's Python runtime will handle ASGI automatically
from app.main import app
