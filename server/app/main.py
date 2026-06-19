"""FastAPI application entrypoint for the Universal File Converter backend."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.config import settings
from app.routers import jobs
from app.utils.logging import configure_logging, get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Ensure storage directories exist on startup."""
    configure_logging()
    settings.ensure_directories()
    logger.info("Storage ready at %s", settings.storage_dir)
    logger.info("Universal File Converter backend v%s started", __version__)
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Universal File Converter API",
    description="Convert Markdown documents into narrated videos.",
    version=__version__,
    lifespan=lifespan,
)

# CORS: allow the Vite dev server to call the API directly if not proxying.
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist before mounting static files (mount needs the dir).
settings.ensure_directories()

# Serve generated media (slides, audio, videos) from the local filesystem.
app.mount(
    settings.storage_url_prefix,
    StaticFiles(directory=str(settings.storage_dir)),
    name="storage",
)

# API routes.
app.include_router(jobs.router)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    """Basic service metadata / health check."""
    return {
        "service": "Universal File Converter API",
        "version": __version__,
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    _request: Request, exc: Exception
) -> JSONResponse:
    """Return a JSON error body for any unhandled exception."""
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error.", "message": str(exc)},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
