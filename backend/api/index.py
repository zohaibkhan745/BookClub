"""
Vercel serverless entry point for FastAPI
Uses Mangum to adapt ASGI to AWS Lambda/Vercel
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import the FastAPI app
from app.main import app

# Import Mangum adapter for serverless
from mangum import Mangum

# Create the handler for Vercel/AWS Lambda
handler = Mangum(app, lifespan="off")
