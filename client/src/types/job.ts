/**
 * Domain types describing a conversion job and its lifecycle.
 * These mirror the shapes returned by the backend API.
 */

/** Unique identifier returned by the backend after an upload. */
export type JobId = string;

/**
 * The lifecycle states a conversion job moves through.
 * Ordered roughly by progression, but the backend is the source of truth.
 */
export type JobStatus =
  | "uploaded"
  | "generating_slides"
  | "generating_audio"
  | "rendering_video"
  | "completed"
  | "failed";

/** Response from POST /upload */
export interface UploadResponse {
  job_id: JobId;
}

/** A single slide derived from the markdown headings. */
export interface Slide {
  /** Stable identifier for the slide (used as a React key). */
  id: string;
  /** Slide title, typically derived from a markdown heading. */
  title: string;
  /** 1-based position of the slide within the deck. */
  index: number;
  /** Optional URL to a rendered thumbnail image. */
  thumbnail_url?: string;
}

/** Response from GET /slides/{job_id} */
export interface SlidesResponse {
  job_id: JobId;
  slides: Slide[];
}

/** Response from GET /status/{job_id} */
export interface StatusResponse {
  job_id: JobId;
  status: JobStatus;
  /** Optional 0-100 progress percentage for the current stage. */
  progress?: number;
  /** Human-readable message, present especially when status is "failed". */
  message?: string;
}

/** Response from GET /result/{job_id} */
export interface ResultResponse {
  job_id: JobId;
  /** URL of the rendered video, playable in an HTML5 <video> element. */
  video_url: string;
  /** Optional direct download URL; falls back to video_url if absent. */
  download_url?: string;
  /** Optional duration of the rendered video in seconds. */
  duration_seconds?: number;
}

/** Response from POST /generate/{job_id} */
export interface GenerateResponse {
  job_id: JobId;
  status: JobStatus;
}
