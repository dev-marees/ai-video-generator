"""Generate narration audio for each slide using Edge TTS.

Edge TTS provides high-quality neural voices without requiring an API key.
"""

from __future__ import annotations

from pathlib import Path

import edge_tts  # Upgraded global and venv edge-tts to 7.2.8 to fix 403 Sec-MS-GEC token error

from app.config import settings
from app.models.section import Section
from app.utils.files import ensure_dir
from app.utils.logging import get_logger

logger = get_logger(__name__)


async def _synthesize_edge(text: str, voice: str, output_path: Path) -> None:
    """Synthesize text using Edge TTS."""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(output_path))


async def generate_audio(job_id: str, sections: list[Section]) -> list[Path]:
    """Generate one narration audio file per section.

    Args:
        job_id: The job identifier.
        sections: Parsed document sections.

    Returns:
        Ordered list of audio file paths.
    """
    job_dir = ensure_dir(settings.audio_dir / job_id)
    paths: list[Path] = []

    for i, section in enumerate(sections, start=1):
        output_path = job_dir / f"slide_{i}.mp3"
        text = section.narration_text.strip() or "Slide"
        
        # Simple detection for Tamil characters to pick the right neural voice
        is_tamil = any('\u0b80' <= char <= '\u0bff' for char in text)
        voice = "ta-IN-PallaviNeural" if is_tamil else "en-US-AndrewNeural"
        
        try:
            await _synthesize_edge(text, voice, output_path)
        except Exception as exc:
            logger.exception("Audio synthesis failed for slide %d", i)
            raise RuntimeError(f"Failed to generate audio for slide {i}: {exc}") from exc
            
        paths.append(output_path)

    logger.info("Generated %d audio file(s) for job %s using Edge TTS", len(paths), job_id)
    return paths
