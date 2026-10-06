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

# Import and expose the FastAPI app directly for Vercel's ASGI runtime.
# Do NOT define a 'handler' variable as Vercel would treat it as a legacy BaseHTTPRequestHandler.
try:
    from app.main import app
except Exception as e:
    import traceback
    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse

    err_msg = traceback.format_exc()
    app = FastAPI(title="Book Club API - Startup Failure")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def error_fallback(full_path: str):
        return PlainTextResponse(
            f"Book Club API Initialization Error:\n\n{err_msg}",
            status_code=500,
            media_type="text/plain"
        )

