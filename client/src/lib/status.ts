import type { JobStatus } from "@/types";

export interface StatusMeta {
  /** Human-friendly label for the status. */
  label: string;
  /** Short description shown beneath the label. */
  description: string;
  /** Whether this status represents active background work. */
  isActive: boolean;
  /** Tailwind classes for the status badge. */
  badgeClassName: string;
  /** Rough completion percentage used for the progress bar fallback. */
  progress: number;
}

/** Ordered pipeline of statuses (excluding terminal failed). */
export const STATUS_ORDER: JobStatus[] = [
  "uploaded",
  "generating_slides",
  "generating_audio",
  "rendering_video",
  "completed",
];

const STATUS_META: Record<JobStatus, StatusMeta> = {
  uploaded: {
    label: "Uploaded",
    description: "File received and queued for processing.",
    isActive: false,
    badgeClassName: "bg-secondary text-secondary-foreground",
    progress: 10,
  },
  generating_slides: {
    label: "Generating slides",
    description: "Building slide previews from your headings.",
    isActive: true,
    badgeClassName: "bg-blue-500/15 text-blue-500",
    progress: 35,
  },
  generating_audio: {
    label: "Generating audio",
    description: "Synthesizing narration for each slide.",
    isActive: true,
    badgeClassName: "bg-violet-500/15 text-violet-500",
    progress: 60,
  },
  rendering_video: {
    label: "Rendering video",
    description: "Composing slides and narration into a video.",
    isActive: true,
    badgeClassName: "bg-amber-500/15 text-amber-500",
    progress: 85,
  },
  completed: {
    label: "Completed",
    description: "Your video is ready to watch and download.",
    isActive: false,
    badgeClassName: "bg-emerald-500/15 text-emerald-500",
    progress: 100,
  },
  failed: {
    label: "Failed",
    description: "Something went wrong during processing.",
    isActive: false,
    badgeClassName: "bg-destructive/15 text-destructive",
    progress: 100,
  },
};

export function getStatusMeta(status: JobStatus): StatusMeta {
  return STATUS_META[status];
}

/** Statuses that represent ongoing work worth polling for. */
export function isProcessingStatus(status: JobStatus): boolean {
  return (
    status === "uploaded" ||
    status === "generating_slides" ||
    status === "generating_audio" ||
    status === "rendering_video"
  );
}
