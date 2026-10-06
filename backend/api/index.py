"""
Vercel serverless entry point for FastAPI
Vercel has native ASGI support - just expose the app directly
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import and expose the FastAPI app directly for Vercel's native ASGI support.
# Vercel's AST parser looks for top-level 'app' (do NOT wrap in try/except or define 'handler').
from app.main import app

