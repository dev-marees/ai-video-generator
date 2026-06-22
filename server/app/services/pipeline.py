"""High-level orchestration of the markdown-to-video pipeline.

Coordinates the parser, slide, audio and video services while keeping the
job's status up to date. Designed to run inside a FastAPI BackgroundTask.
"""

from __future__ import annotations

from pathlib import Path

from app.config import settings
from app.models.job import JobStatus
from app.models.section import Section
from app.services import (
    audio_generator,
    markdown_parser,
    slide_generator,
    video_generator,
)
from app.services.job_manager import job_manager
from app.utils.logging import get_logger

logger = get_logger(__name__)


def load_sections(job_id: str) -> list[Section]:
    """Read the uploaded markdown for a job and parse it into sections."""
    md_path = job_manager.markdown_path(job_id)
    if md_path is None:
        raise FileNotFoundError(f"No markdown file found for job {job_id}")
    text = md_path.read_text(encoding="utf-8", errors="replace")
    return markdown_parser.parse_markdown(text)


def ensure_slides(job_id: str) -> tuple[list[Section], list[Path]]:
    """Generate slide images for a job if they are not already present."""
    sections = load_sections(job_id)
    if slide_generator.slides_exist(job_id, len(sections)):
        job_dir = settings.slides_dir / job_id
        paths = [job_dir / f"slide_{i}.png" for i in range(1, len(sections) + 1)]
        logger.info("Reusing %d existing slide(s) for job %s", len(paths), job_id)
    else:
        paths = slide_generator.generate_slides(job_id, sections)
    job_manager.update(job_id, slide_count=len(sections))
    return sections, paths


async def run_generation(job_id: str) -> None:
    """Run the full generation pipeline for a job, updating status as it goes."""
    logger.info("Starting generation pipeline for job %s", job_id)
    try:
        # 1. Slides
        job_manager.update(job_id, status=JobStatus.GENERATING_SLIDES, error="")
        sections, slide_images = ensure_slides(job_id)

        # 2. Audio
        job_manager.update(job_id, status=JobStatus.GENERATING_AUDIO)
        audio_files = await audio_generator.generate_audio(job_id, sections)

        # 3. Video
        job_manager.update(job_id, status=JobStatus.RENDERING_VIDEO)
        video_generator.render_video(job_id, slide_images, audio_files)

        # 4. Done
        video_url = settings.media_url("videos", job_id, "output.mp4")
        job_manager.update(
            job_id, status=JobStatus.COMPLETED, video_url=video_url
        )
        logger.info("Generation pipeline completed for job %s", job_id)
    except Exception as exc:
        logger.exception("Generation pipeline failed for job %s", job_id)
        job_manager.update(
            job_id, status=JobStatus.FAILED, error=str(exc)
        )
