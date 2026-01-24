# Vercel serverless entry point
# This file is required for Vercel to recognize the FastAPI app

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app
from app.main import app

# Vercel expects an "app" or "handler" variable
# Export the FastAPI app directly - Vercel's Python runtime handles ASGI apps
handler = app
