"""Render slide images from parsed sections using Pillow."""

from __future__ import annotations

from pathlib import Path

# pyrefly: ignore [missing-import]
from PIL import Image, ImageDraw, ImageFont

from app.config import settings
from app.models.section import Section
from app.utils.files import ensure_dir
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Candidate font files, tried in order. Falls back to Pillow's default.
_TITLE_FONT_CANDIDATES = (
    "/System/Library/Fonts/Supplemental/Tamil MN.ttc",
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
)
_TEXT_FONT_CANDIDATES = (
    "/System/Library/Fonts/Supplemental/Tamil Sangam MN.ttc",
    "/System/Library/Fonts/Supplemental/Tamil MN.ttc",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
)


def _load_font(candidates: tuple[str, ...], size: int) -> ImageFont.FreeTypeFont:
    """Load the first available TrueType font, else Pillow's default."""
    for candidate in candidates:
        if Path(candidate).exists():
            try:
                return ImageFont.truetype(candidate, size=size)
            except OSError:
                continue
    logger.warning("No TrueType font found; using Pillow default font.")
    return ImageFont.load_default(size=size)


def _wrap_text(
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: int,
    draw: ImageDraw.ImageDraw,
) -> list[str]:
    """Greedy word-wrap ``text`` to fit ``max_width`` pixels."""
    if not text:
        return []
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        width = draw.textlength(trial, font=font)
        if width <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _render_slide(section: Section, index: int, output_path: Path) -> None:
    """Render a single slide image to ``output_path``."""
    width = settings.slide_width
    height = settings.slide_height
    margin = settings.slide_margin

    image = Image.new("RGB", (width, height), settings.slide_bg_color)
    draw = ImageDraw.Draw(image)

    title_font = _load_font(_TITLE_FONT_CANDIDATES, settings.slide_title_size)
    text_font = _load_font(_TEXT_FONT_CANDIDATES, settings.slide_text_size)

    # Accent bar on the left edge.
    draw.rectangle(
        [(0, 0), (16, height)],
        fill=settings.slide_accent_color,
    )

    # Slide number, top-right.
    number_text = f"{index}"
    number_width = draw.textlength(number_text, font=text_font)
    draw.text(
        (width - margin - number_width, margin // 2),
        number_text,
        font=text_font,
        fill=settings.slide_accent_color,
    )

    content_max_width = width - (2 * margin)
    y = margin

    # --- Title (wrapped) ---
    title_lines = _wrap_text(section.title, title_font, content_max_width, draw)
    title_line_height = settings.slide_title_size + 14
    for line in title_lines[:3]:
        draw.text((margin, y), line, font=title_font, fill=settings.slide_title_color)
        y += title_line_height

    # Divider under the title.
    y += 12
    draw.line(
        [(margin, y), (width - margin, y)],
        fill=settings.slide_accent_color,
        width=3,
    )
    y += 32

    # --- Content (wrapped, clipped to available height) ---
    text_line_height = settings.slide_text_size + 14
    max_lines = max(0, (height - margin - y) // text_line_height)
    content_lines = _wrap_text(section.content, text_font, content_max_width, draw)

    visible = content_lines[:max_lines]
    if len(content_lines) > max_lines and visible:
        visible[-1] = visible[-1].rstrip(".") + " …"

    for line in visible:
        draw.text((margin, y), line, font=text_font, fill=settings.slide_text_color)
        y += text_line_height

    image.save(output_path, format="PNG")


def generate_slides(job_id: str, sections: list[Section]) -> list[Path]:
    """Generate slide PNGs for every section.

    Args:
        job_id: The job identifier (used as the storage subfolder).
        sections: Parsed document sections.

    Returns:
        Ordered list of slide image paths (slide_1.png, slide_2.png, ...).
    """
    job_dir = ensure_dir(settings.slides_dir / job_id)
    paths: list[Path] = []

    for i, section in enumerate(sections, start=1):
        output_path = job_dir / f"slide_{i}.png"
        _render_slide(section, i, output_path)
        paths.append(output_path)

    logger.info("Generated %d slide image(s) for job %s", len(paths), job_id)
    return paths


def slides_exist(job_id: str, expected_count: int) -> bool:
    """Return True if all expected slide files already exist on disk."""
    job_dir = settings.slides_dir / job_id
    if not job_dir.is_dir() or expected_count <= 0:
        return False
    return all(
        (job_dir / f"slide_{i}.png").exists()
        for i in range(1, expected_count + 1)
    )
