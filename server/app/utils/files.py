"""Filesystem helper utilities."""

from __future__ import annotations

import shutil
from pathlib import Path


def ensure_dir(path: Path) -> Path:
    """Create a directory (and parents) if missing and return it."""
    path.mkdir(parents=True, exist_ok=True)
    return path


def reset_dir(path: Path) -> Path:
    """Remove a directory if it exists, then recreate it empty."""
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)
    path.mkdir(parents=True, exist_ok=True)
    return path


def is_markdown_filename(filename: str | None) -> bool:
    """Return True if the filename has a Markdown extension."""
    if not filename:
        return False
    return filename.lower().endswith((".md", ".markdown"))


def safe_stem(filename: str | None, default: str = "document") -> str:
    """Return a safe, human-readable stem from an uploaded filename."""
    if not filename:
        return default
    stem = Path(filename).stem.strip()
    return stem or default
