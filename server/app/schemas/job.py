"""Request/response schemas for the conversion API.

These mirror the documented API contract. A few extra, harmless fields
(``index``, ``thumbnail_url``, ``job_id``, ``status``) are included so the
existing frontend can consume the responses without changes.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.job import JobStatus


class UploadResponse(BaseModel):
    """Response for POST /upload."""

    job_id: str = Field(..., description="Unique identifier for the job.")
    filename: str = Field(..., description="Original uploaded filename.")


class SlideItem(BaseModel):
    """A single generated slide preview."""

    id: int = Field(..., description="1-based slide id.")
    title: str = Field(..., description="Slide title from the heading.")
    image_url: str = Field(..., description="Public URL of the slide image.")
    # Aliases for frontend compatibility:
    index: int = Field(..., description="Same as id; 1-based position.")
    thumbnail_url: str = Field(..., description="Same as image_url.")


class SlidesResponse(BaseModel):
    """Response for GET /slides/{job_id}."""

    job_id: str
    slides: list[SlideItem]


class GenerateResponse(BaseModel):
    """Response for POST /generate/{job_id}."""

    message: str
    job_id: str
    status: JobStatus


class StatusResponse(BaseModel):
    """Response for GET /status/{job_id}."""

    job_id: str
    status: JobStatus
    message: str | None = Field(
        default=None, description="Error or informational message."
    )


class VideoResultResponse(BaseModel):
    """Response for GET /result/{job_id}."""

    job_id: str
    video_url: str
    download_url: str
