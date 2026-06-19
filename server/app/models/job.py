"""Domain models for conversion jobs and their lifecycle state."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    """The lifecycle states a conversion job moves through."""

    UPLOADED = "uploaded"
    GENERATING_SLIDES = "generating_slides"
    GENERATING_AUDIO = "generating_audio"
    RENDERING_VIDEO = "rendering_video"
    COMPLETED = "completed"
    FAILED = "failed"


class JobRecord(BaseModel):
    """Persisted state for a single conversion job.

    Serialized to ``storage/uploads/{job_id}/meta.json`` and mirrored in an
    in-memory store for fast status reads.
    """

    job_id: str
    filename: str
    status: JobStatus = JobStatus.UPLOADED
    # Number of slides detected/generated, when known.
    slide_count: int = 0
    # Relative public URL of the rendered video, set when completed.
    video_url: str | None = None
    # Human-readable error message, set when status is FAILED.
    error: str | None = None
    created_at: str = Field(default="")
    updated_at: str = Field(default="")
