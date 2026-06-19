"""Parse Markdown into ordered sections keyed by headings.

Strategy: render Markdown to HTML (python-markdown), then walk the HTML with
BeautifulSoup. Each ``<h1>``/``<h2>``/``<h3>`` starts a new section; the text
of the elements that follow (until the next heading) becomes its content.
"""

from __future__ import annotations

import markdown
from bs4 import BeautifulSoup, Tag

from app.models.section import Section
from app.utils.logging import get_logger

logger = get_logger(__name__)

_HEADING_TAGS = {"h1", "h2", "h3"}
# Block-level tags whose text we collect as slide content.
_CONTENT_TAGS = {
    "p",
    "ul",
    "ol",
    "li",
    "pre",
    "code",
    "blockquote",
    "table",
    "h4",
    "h5",
    "h6",
}


def _clean_text(text: str) -> str:
    """Collapse whitespace and trim."""
    return " ".join(text.split()).strip()


def parse_markdown(md_text: str) -> list[Section]:
    """Convert Markdown text into a list of :class:`Section` objects.

    Args:
        md_text: Raw Markdown document content.

    Returns:
        Ordered list of sections. Always returns at least one section so the
        downstream pipeline has something to render.
    """
    html = markdown.markdown(
        md_text or "",
        extensions=["extra", "sane_lists"],
    )
    soup = BeautifulSoup(html, "html.parser")

    sections: list[Section] = []
    current_title: str | None = None
    current_parts: list[str] = []

    def flush() -> None:
        """Commit the in-progress section, if any."""
        nonlocal current_title, current_parts
        title = (current_title or "").strip()
        content = _clean_text(" ".join(current_parts))
        if title or content:
            sections.append(
                Section(title=title or "Untitled", content=content)
            )
        current_title = None
        current_parts = []

    # Iterate only over top-level elements to avoid double-counting nested text.
    for element in soup.find_all(recursive=False):
        if not isinstance(element, Tag):
            continue

        if element.name in _HEADING_TAGS:
            # A new heading begins a new section.
            flush()
            current_title = _clean_text(element.get_text())
        elif element.name in _CONTENT_TAGS:
            text = _clean_text(element.get_text(separator=" "))
            if text:
                current_parts.append(text)

    flush()

    if not sections:
        # Fall back to a single section from the raw text.
        fallback = _clean_text(md_text)
        sections.append(
            Section(title="Slide", content=fallback or "(empty document)")
        )

    logger.info("Parsed markdown into %d section(s)", len(sections))
    return sections
