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

init_error = None
try:
    from app.main import app as fastapi_app
except Exception:
    import traceback
    init_error = traceback.format_exc()
    fastapi_app = None


async def app(scope, receive, send):
    """Top-level ASGI entrypoint for Vercel with comprehensive diagnostic error handling."""
    if scope.get("type") == "lifespan":
        # Handle lifespan cleanly for serverless
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                await send({"type": "lifespan.shutdown.complete"})
                return

    if init_error:
        body = f"Book Club API Startup Error:\n\n{init_error}".encode("utf-8")
        await send({
            "type": "http.response.start",
            "status": 500,
            "headers": [
                [b"content-type", b"text/plain; charset=utf-8"],
                [b"content-length", str(len(body)).encode("ascii")],
            ],
        })
        await send({
            "type": "http.response.body",
            "body": body,
        })
        return

    try:
        await fastapi_app(scope, receive, send)
    except Exception:
        import traceback
        runtime_err = traceback.format_exc()
        body = f"Book Club API Runtime Error:\n\n{runtime_err}".encode("utf-8")
        await send({
            "type": "http.response.start",
            "status": 500,
            "headers": [
                [b"content-type", b"text/plain; charset=utf-8"],
                [b"content-length", str(len(body)).encode("ascii")],
            ],
        })
        await send({
            "type": "http.response.body",
            "body": body,
        })

