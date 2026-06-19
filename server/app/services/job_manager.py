"""In-memory + on-disk job state management.

Job records are kept in a process-local dict for fast reads and mirrored to
``storage/uploads/{job_id}/meta.json`` so state survives a restart and can be
inspected on disk. A lock guards concurrent access from background tasks.
"""

from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings
from app.models.job import JobRecord, JobStatus
from app.utils.files import ensure_dir, safe_stem
from app.utils.logging import get_logger

logger = get_logger(__name__)

_META_FILENAME = "meta.json"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class JobManager:
    """Manages the lifecycle and persisted state of conversion jobs."""

    def __init__(self) -> None:
        self._jobs: dict[str, JobRecord] = {}
        self._lock = threading.RLock()

    # --- Paths ----------------------------------------------------------------
    def job_upload_dir(self, job_id: str) -> Path:
        return settings.upload_dir / job_id

    def meta_path(self, job_id: str) -> Path:
        return self.job_upload_dir(job_id) / _META_FILENAME

    def markdown_path(self, job_id: str) -> Path | None:
        """Return the uploaded markdown file path for a job, if present."""
        record = self.get_job(job_id)
        if record is None:
            return None
        candidate = self.job_upload_dir(job_id) / record.filename
        if candidate.exists():
            return candidate
        # Fall back to the first markdown file in the job's upload folder.
        upload_dir = self.job_upload_dir(job_id)
        if upload_dir.is_dir():
            for path in upload_dir.iterdir():
                if path.suffix.lower() in (".md", ".markdown"):
                    return path
        return None

    # --- Persistence ----------------------------------------------------------
    def _persist(self, record: JobRecord) -> None:
        ensure_dir(self.job_upload_dir(record.job_id))
        self.meta_path(record.job_id).write_text(
            record.model_dump_json(indent=2), encoding="utf-8"
        )

    def _load_from_disk(self, job_id: str) -> JobRecord | None:
        meta = self.meta_path(job_id)
        if not meta.exists():
            return None
        try:
            data = json.loads(meta.read_text(encoding="utf-8"))
            return JobRecord.model_validate(data)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning("Failed to load meta for job %s: %s", job_id, exc)
            return None

    # --- CRUD -----------------------------------------------------------------
    def create_job(self, filename: str) -> JobRecord:
        """Create and persist a new job record with a unique id."""
        job_id = str(uuid.uuid4())
        timestamp = _now_iso()
        record = JobRecord(
            job_id=job_id,
            filename=filename or f"{safe_stem(filename)}.md",
            status=JobStatus.UPLOADED,
            created_at=timestamp,
            updated_at=timestamp,
        )
        with self._lock:
            self._jobs[job_id] = record
            self._persist(record)
        logger.info("Created job %s for file '%s'", job_id, record.filename)
        return record

    def get_job(self, job_id: str) -> JobRecord | None:
        """Return a job record from memory, loading from disk if needed."""
        with self._lock:
            record = self._jobs.get(job_id)
            if record is not None:
                return record
            loaded = self._load_from_disk(job_id)
            if loaded is not None:
                self._jobs[job_id] = loaded
            return loaded

    def update(
        self,
        job_id: str,
        *,
        status: JobStatus | None = None,
        error: str | None = None,
        video_url: str | None = None,
        slide_count: int | None = None,
    ) -> JobRecord:
        """Update mutable fields of a job and persist the change."""
        with self._lock:
            record = self.get_job(job_id)
            if record is None:
                raise KeyError(f"Unknown job_id: {job_id}")
            if status is not None:
                record.status = status
            if error is not None:
                record.error = error
            if video_url is not None:
                record.video_url = video_url
            if slide_count is not None:
                record.slide_count = slide_count
            record.updated_at = _now_iso()
            self._jobs[job_id] = record
            self._persist(record)
        logger.info("Job %s -> status=%s", job_id, record.status.value)
        return record


# Module-level singleton used across the application.
job_manager = JobManager()
