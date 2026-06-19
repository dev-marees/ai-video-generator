import type { JobId } from "@/types";

/**
 * Centralized React Query cache keys. Keeping them in one place avoids
 * typos and makes invalidation predictable.
 */
export const queryKeys = {
  slides: (jobId: JobId) => ["slides", jobId] as const,
  status: (jobId: JobId) => ["status", jobId] as const,
  result: (jobId: JobId) => ["result", jobId] as const,
};
