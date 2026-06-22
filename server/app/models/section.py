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
        """Text used for narration; enhanced for a teaching style."""
        # Simple detection for Tamil characters
        is_tamil = any('\u0b80' <= char <= '\u0bff' for char in self.title + self.content)
        
        if is_tamil:
            intro = f"இந்த ஸ்லைடில் நாம் {self.title} பற்றிப் பார்ப்போம். "
        else:
            intro = f"On this slide, let's look at {self.title}. "

        spoken = f"{intro} {self.content}"
        return spoken.strip() or self.title or "Slide"
