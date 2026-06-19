"""Combine slide images and narration audio into a single MP4 via ffmpeg.

Pipeline:
  1. Probe each audio clip for its duration.
  2. Render one MP4 segment per slide (still image held for the clip length,
     plus a short silent tail), encoded with identical parameters.
  3. Concatenate all segments into the final output.mp4.
"""

from __future__ import annotations

from pathlib import Path

import ffmpeg

from app.config import settings
from app.utils.files import ensure_dir
from app.utils.logging import get_logger

logger = get_logger(__name__)


def _ffmpeg_error_message(exc: ffmpeg.Error) -> str:
    """Extract a readable message from an ffmpeg.Error."""
    stderr = exc.stderr.decode("utf-8", errors="ignore") if exc.stderr else ""
    tail = stderr.strip().splitlines()[-5:]
    return " | ".join(tail) if tail else str(exc)


def _probe_duration(audio_path: Path) -> float:
    """Return the duration of an audio file in seconds."""
    try:
        info = ffmpeg.probe(str(audio_path))
        return float(info["format"]["duration"])
    except (ffmpeg.Error, KeyError, ValueError) as exc:
        logger.warning(
            "Could not probe duration for %s (%s); using fallback.",
            audio_path.name,
            exc,
        )
        return settings.fallback_slide_duration


def _render_segment(
    image_path: Path,
    audio_path: Path,
    duration: float,
    output_path: Path,
) -> None:
    """Render a single image+audio pair into an MP4 segment."""
    hold = duration + settings.slide_tail_padding

    video_in = ffmpeg.input(
        str(image_path),
        loop=1,
        framerate=settings.video_fps,
        t=hold,
    )
    audio_in = ffmpeg.input(str(audio_path))

    stream = ffmpeg.output(
        video_in,
        audio_in,
        str(output_path),
        **{
            "c:v": settings.video_codec,
            "c:a": settings.audio_codec,
            "b:a": settings.audio_bitrate,
            "pix_fmt": settings.pixel_format,
            "r": settings.video_fps,
            "movflags": "+faststart",
        },
    )
    ffmpeg.run(
        stream,
        overwrite_output=True,
        capture_stdout=True,
        capture_stderr=True,
    )


def _concat_segments(segments: list[Path], output_path: Path) -> None:
    """Concatenate equally-encoded MP4 segments into one file."""
    concat_list = output_path.parent / "segments.txt"
    lines = [f"file '{seg.as_posix()}'" for seg in segments]
    concat_list.write_text("\n".join(lines) + "\n", encoding="utf-8")

    stream = ffmpeg.output(
        ffmpeg.input(str(concat_list), format="concat", safe=0),
        str(output_path),
        **{"c": "copy", "movflags": "+faststart"},
    )
    ffmpeg.run(
        stream,
        overwrite_output=True,
        capture_stdout=True,
        capture_stderr=True,
    )


def render_video(
    job_id: str,
    slide_images: list[Path],
    audio_files: list[Path],
) -> Path:
    """Render the final video for a job.

    Args:
        job_id: The job identifier (used as the storage subfolder).
        slide_images: Ordered slide image paths.
        audio_files: Ordered audio file paths (parallel to slide_images).

    Returns:
        Path to the rendered ``output.mp4``.

    Raises:
        ValueError: If inputs are empty or mismatched.
        RuntimeError: If ffmpeg fails.
    """
    if not slide_images or not audio_files:
        raise ValueError("No slides or audio available to render.")
    if len(slide_images) != len(audio_files):
        raise ValueError(
            "Mismatch between slide and audio counts "
            f"({len(slide_images)} vs {len(audio_files)})."
        )

    job_dir = ensure_dir(settings.videos_dir / job_id)
    segments_dir = ensure_dir(job_dir / "segments")
    output_path = job_dir / "output.mp4"

    try:
        segments: list[Path] = []
        for i, (image, audio) in enumerate(
            zip(slide_images, audio_files), start=1
        ):
            duration = _probe_duration(audio)
            segment_path = segments_dir / f"segment_{i}.mp4"
            logger.info(
                "Rendering segment %d/%d (%.2fs) for job %s",
                i,
                len(slide_images),
                duration,
                job_id,
            )
            _render_segment(image, audio, duration, segment_path)
            segments.append(segment_path)

        logger.info("Concatenating %d segment(s) for job %s", len(segments), job_id)
        _concat_segments(segments, output_path)
    except ffmpeg.Error as exc:
        message = _ffmpeg_error_message(exc)
        logger.error("ffmpeg failed for job %s: %s", job_id, message)
        raise RuntimeError(f"Video rendering failed: {message}") from exc

    logger.info("Rendered video for job %s -> %s", job_id, output_path)
    return output_path
