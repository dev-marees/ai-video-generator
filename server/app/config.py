"""Application configuration.

Central place for filesystem paths and slide/audio/video parameters.
Everything is local-filesystem based — no external services.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel


class Settings(BaseModel):
    """Runtime settings for the backend.

    Paths are derived from this file's location so the server works
    regardless of the current working directory.
    """

    # --- Project / app paths -------------------------------------------------
    app_dir: Path = Path(__file__).resolve().parent
    base_dir: Path = Path(__file__).resolve().parent.parent  # server/

    # --- Server ---------------------------------------------------------------
    host: str = "0.0.0.0"
    port: int = 8080
    # CORS origins allowed to call the API directly (when not using the
    # frontend dev proxy). The Vite dev server runs on 5173.
    cors_origins: tuple[str, ...] = (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    )

    # --- Static serving -------------------------------------------------------
    # URL prefix under which generated files are exposed (StaticFiles mount).
    storage_url_prefix: str = "/storage"
    # Optional absolute base (e.g. "http://localhost:8080"). When empty,
    # returned media URLs are relative (e.g. "/storage/...").
    public_base_url: str = ""

    # --- Slide rendering ------------------------------------------------------
    slide_width: int = 1280
    slide_height: int = 720
    slide_bg_color: tuple[int, int, int] = (255, 255, 255)
    slide_title_color: tuple[int, int, int] = (17, 24, 39)  # slate-900
    slide_text_color: tuple[int, int, int] = (55, 65, 81)  # slate-700
    slide_accent_color: tuple[int, int, int] = (37, 99, 235)  # blue-600
    slide_title_size: int = 64
    slide_text_size: int = 34
    slide_margin: int = 96

    # --- Audio (gTTS) ---------------------------------------------------------
    tts_lang: str = "en"
    tts_slow: bool = False

    # --- Video (ffmpeg) -------------------------------------------------------
    video_fps: int = 24
    video_codec: str = "libx264"
    audio_codec: str = "aac"
    audio_bitrate: str = "192k"
    pixel_format: str = "yuv420p"
    # Extra seconds of still frame held after narration on each slide.
    slide_tail_padding: float = 0.6
    # Fallback duration (seconds) for a slide if audio probing fails.
    fallback_slide_duration: float = 4.0

    # --- Storage directories --------------------------------------------------
    @property
    def storage_dir(self) -> Path:
        return self.base_dir / "storage"

    @property
    def upload_dir(self) -> Path:
        return self.storage_dir / "uploads"

    @property
    def slides_dir(self) -> Path:
        return self.storage_dir / "slides"

    @property
    def audio_dir(self) -> Path:
        return self.storage_dir / "audio"

    @property
    def videos_dir(self) -> Path:
        return self.storage_dir / "videos"

    def ensure_directories(self) -> None:
        """Create all storage directories if they do not yet exist."""
        for directory in (
            self.storage_dir,
            self.upload_dir,
            self.slides_dir,
            self.audio_dir,
            self.videos_dir,
        ):
            directory.mkdir(parents=True, exist_ok=True)

    def media_url(self, *parts: str) -> str:
        """Build a public URL for a stored media file.

        Example: media_url("slides", job_id, "slide_1.png")
        -> "/storage/slides/<job_id>/slide_1.png"
        """
        path = "/".join((self.storage_url_prefix.strip("/"), *parts))
        url = f"/{path}"
        if self.public_base_url:
            return f"{self.public_base_url.rstrip('/')}{url}"
        return url


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()


settings = get_settings()
