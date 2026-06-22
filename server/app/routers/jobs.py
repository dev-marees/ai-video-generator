"""API endpoints for the conversion workflow."""

from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pathlib import Path

from app.config import settings
from app.models.job import JobRecord, JobStatus
from app.schemas import (
    GenerateResponse,
    SlideItem,
    SlidesResponse,
    StatusResponse,
    UploadResponse,
    VideoResultResponse,
)
from app.services import pipeline
from app.services.job_manager import job_manager
from app.utils.files import ensure_dir, is_markdown_filename
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["jobs"])

_MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


def _require_job(job_id: str) -> JobRecord:
    """Fetch a job or raise 404."""
    record = job_manager.get_job(job_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{job_id}' not found.",
        )
    return record


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a Markdown file and create a job.",
)
async def upload(file: UploadFile = File(...)) -> UploadResponse:
    """Accept a ``.md`` file, store it, and return a new job id."""
    if not is_markdown_filename(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Markdown (.md/.markdown) files are accepted.",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    if len(contents) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 10 MB.",
        )

    record = job_manager.create_job(file.filename or "document.md")
    job_dir = ensure_dir(job_manager.job_upload_dir(record.job_id))
    (job_dir / record.filename).write_bytes(contents)

    logger.info("Stored upload for job %s (%d bytes)", record.job_id, len(contents))
    return UploadResponse(job_id=record.job_id, filename=record.filename)


@router.get(
    "/slides/{job_id}",
    response_model=SlidesResponse,
    summary="Parse markdown and return slide previews (generating if needed).",
)
async def get_slides(job_id: str) -> SlidesResponse:
    """Generate slide images on demand (if absent) and return their metadata."""
    _require_job(job_id)
    try:
        sections, _paths = pipeline.ensure_slides(job_id)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Slide generation failed for job %s", job_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate slides: {exc}",
        ) from exc

    slides = [
        SlideItem(
            id=i,
            index=i,
            title=section.title,
            image_url=settings.media_url("slides", job_id, f"slide_{i}.png"),
            thumbnail_url=settings.media_url("slides", job_id, f"slide_{i}.png"),
        )
        for i, section in enumerate(sections, start=1)
    ]
    return SlidesResponse(job_id=job_id, slides=slides)


@router.post(
    "/generate/{job_id}",
    response_model=GenerateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start asynchronous video generation for a job.",
)
async def generate(
    job_id: str, background_tasks: BackgroundTasks
) -> GenerateResponse:
    """Kick off the slides → audio → video pipeline in the background."""
    record = _require_job(job_id)

    if record.status in (
        JobStatus.GENERATING_SLIDES,
        JobStatus.GENERATING_AUDIO,
        JobStatus.RENDERING_VIDEO,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Video generation is already in progress for this job.",
        )

    background_tasks.add_task(pipeline.run_generation, job_id)
    logger.info("Queued video generation for job %s", job_id)

    return GenerateResponse(
        message="Video generation started",
        job_id=job_id,
        status=JobStatus.GENERATING_SLIDES,
    )


@router.get(
    "/status/{job_id}",
    response_model=StatusResponse,
    summary="Get the current processing status of a job.",
)
async def get_status(job_id: str) -> StatusResponse:
    """Return the current status (and any error message) for a job."""
    record = _require_job(job_id)
    return StatusResponse(
        job_id=record.job_id,
        status=record.status,
        message=record.error or None,
    )


@router.get(
    "/result/{job_id}",
    response_model=VideoResultResponse,
    summary="Get the rendered video URL for a completed job.",
)
async def get_result(job_id: str) -> VideoResultResponse:
    """Return the video URL once the job has completed."""
    record = _require_job(job_id)

    if record.status == JobStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=record.error or "Video generation failed.",
        )
    if record.status != JobStatus.COMPLETED or not record.video_url:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Video is not ready yet. Current status: "
            f"{record.status.value}.",
        )

    return VideoResultResponse(
        job_id=record.job_id,
        video_url=record.video_url,
        download_url=record.video_url,
    )


@router.get(
    "/audio/{job_id}/{slide_index}",
    summary="Get the narration audio for a specific slide.",
)
async def get_slide_audio(job_id: str, slide_index: int) -> FileResponse:
    """Serve a single slide's MP3 file."""
    _require_job(job_id)
    audio_path = settings.audio_dir / job_id / f"slide_{slide_index}.mp3"
    
    if not audio_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audio for slide {slide_index} not found. Has generation started?",
        )
    
    return FileResponse(
        path=audio_path,
        media_type="audio/mpeg",
        filename=f"slide_{slide_index}.mp3",
    )
