"""Generate narration audio for each slide using gTTS.

Note: gTTS uses Google's online text-to-speech service, so an internet
connection is required during audio generation.
"""

from __future__ import annotations

from pathlib import Path

from gtts import gTTS
from gtts.tts import gTTSError

from app.config import settings
from app.models.section import Section
from app.utils.files import ensure_dir
from app.utils.logging import get_logger

logger = get_logger(__name__)


def _synthesize(text: str, output_path: Path) -> None:
    """Synthesize a single narration clip to ``output_path`` (mp3)."""
    spoken = text.strip() or "Slide"
    tts = gTTS(text=spoken, lang=settings.tts_lang, slow=settings.tts_slow)
    tts.save(str(output_path))


def generate_audio(job_id: str, sections: list[Section]) -> list[Path]:
    """Generate one narration audio file per section.

    Args:
        job_id: The job identifier (used as the storage subfolder).
        sections: Parsed document sections.

    Returns:
        Ordered list of audio file paths (slide_1.mp3, slide_2.mp3, ...).

    Raises:
        RuntimeError: If text-to-speech synthesis fails (e.g. no network).
    """
    job_dir = ensure_dir(settings.audio_dir / job_id)
    paths: list[Path] = []

    for i, section in enumerate(sections, start=1):
        output_path = job_dir / f"slide_{i}.mp3"
        try:
            _synthesize(section.narration_text, output_path)
        except gTTSError as exc:  # pragma: no cover - network dependent
            raise RuntimeError(
                "Text-to-speech failed. gTTS requires an internet connection. "
                f"Underlying error: {exc}"
            ) from exc
        paths.append(output_path)

    logger.info("Generated %d audio file(s) for job %s", len(paths), job_id)
    return paths
