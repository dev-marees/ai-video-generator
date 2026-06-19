import { useQuery } from "@tanstack/react-query";
import { converterApi } from "@/api/converter";
import { queryKeys } from "@/api/queryKeys";
import type { JobId, SlidesResponse } from "@/types";

/**
 * Fetches slide previews from GET /slides/{job_id}.
 * Only enabled once a job id exists and slides are ready (enabled flag).
 */
export function useSlides(jobId: JobId | null, enabled: boolean) {
  return useQuery<SlidesResponse, Error>({
    queryKey: jobId ? queryKeys.slides(jobId) : ["slides", "idle"],
    queryFn: () => converterApi.getSlides(jobId as JobId),
    enabled: Boolean(jobId) && enabled,
    staleTime: 60_000,
  });
}
