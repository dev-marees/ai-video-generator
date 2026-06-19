"""Domain model for a parsed Markdown section."""

from __future__ import annotations

from pydantic import BaseModel


class Section(BaseModel):
    """A single slide-worthy chunk of the document.

    Produced by the Markdown parser: one section per heading, with the
    text that follows it (until the next heading) as its content.
    """

    title: str
    content: str

    @property
    def narration_text(self) -> str:
        """Text used for narration; falls back to the title if empty."""
        spoken = ". ".join(part for part in (self.title, self.content) if part)
        return spoken.strip() or self.title or "Slide"
