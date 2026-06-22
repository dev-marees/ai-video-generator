"""Render slide images from parsed sections using Pillow.

Optimized for educational/teaching content with support for complex scripts like Tamil.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from app.config import settings
from app.models.section import Section
from app.utils.files import ensure_dir
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Candidate font files for Tamil and English.
_TITLE_FONT_CANDIDATES = (
    str(settings.fonts_dir / "NotoSansTamil-Bold.ttf"),
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
)
_TEXT_FONT_CANDIDATES = (
    str(settings.fonts_dir / "NotoSansTamil-Regular.ttf"),
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
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
        # Use textlength for accurate measurement
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
    """Render a single slide image with a premium educational layout."""
    width = settings.slide_width
    height = settings.slide_height
    margin = settings.slide_margin
    
    # Premium Colors
    bg_color = (250, 251, 252)  # Soft off-white
    accent_color = settings.slide_accent_color
    text_color = (55, 65, 81)   # Slate 700
    title_color = (17, 24, 39)  # Slate 900

    image = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(image)

    # Use slightly smaller sizes if titles/text are very long
    title_font = _load_font(_TITLE_FONT_CANDIDATES, settings.slide_title_size)
    text_font = _load_font(_TEXT_FONT_CANDIDATES, settings.slide_text_size)

    # 1. Subtle Background Element (Soft top bar)
    draw.rectangle([(0, 0), (width, 8)], fill=accent_color)
    
    # 2. Slide Number Badge
    badge_w, badge_h = 60, 40
    draw.rectangle(
        [(width - margin - badge_w, margin // 2), (width - margin, margin // 2 + badge_h)],
        fill=(229, 231, 235), # Gray 200
    )
    slide_num = str(index)
    num_len = draw.textlength(slide_num, font=text_font)
    draw.text(
        (width - margin - (badge_w + num_len) // 2, margin // 2 + 5),
        slide_num,
        font=text_font,
        fill=accent_color
    )

    y = margin

    # 3. Title - Centered Layout
    content_max_width = width - (2 * margin)
    title_lines = _wrap_text(section.title, title_font, content_max_width, draw)
    title_line_height = settings.slide_title_size + 20 # More space for Tamil
    
    for line in title_lines[:2]:
        line_w = draw.textlength(line, font=title_font)
        draw.text(
            ((width - line_w) // 2, y), 
            line, 
            font=title_font, 
            fill=title_color
        )
        y += title_line_height

    # 4. Divider
    y += 20
    div_w = 200
    draw.line(
        [((width - div_w) // 2, y), ((width + div_w) // 2, y)],
        fill=accent_color,
        width=4
    )
    y += 60

    # 5. Content - Bullet points style
    text_line_height = settings.slide_text_size + 24 # Generous spacing for Tamil
    content_lines = _wrap_text(section.content, text_font, content_max_width - 80, draw)
    
    # Maximize visibility
    max_y = height - margin
    
    for line in content_lines:
        if y + text_line_height > max_y:
            break
        
        # Bullet point circle
        bullet_x = margin + 20
        bullet_y = y + (text_line_height // 2) - 4
        draw.ellipse([bullet_x, bullet_y, bullet_x + 8, bullet_y + 8], fill=accent_color)
        
        draw.text(
            (margin + 60, y), 
            line, 
            font=text_font, 
            fill=text_color
        )
        y += text_line_height

    image.save(output_path, format="PNG")


def generate_slides(job_id: str, sections: list[Section]) -> list[Path]:
    """Generate all slide PNGs."""
    job_dir = ensure_dir(settings.slides_dir / job_id)
    paths: list[Path] = []

    for i, section in enumerate(sections, start=1):
        output_path = job_dir / f"slide_{i}.png"
        _render_slide(section, i, output_path)
        paths.append(output_path)

    logger.info("Generated %d refined slide image(s) for job %s", len(paths), job_id)
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
