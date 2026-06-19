import { useQuery } from "@tanstack/react-query";
import { converterApi } from "@/api/converter";
import { queryKeys } from "@/api/queryKeys";
import type { JobId, ResultResponse } from "@/types";

/**
 * Fetches the rendered video result from GET /result/{job_id}.
 * Enabled only once the job has completed.
 */
export function useResult(jobId: JobId | null, enabled: boolean) {
  return useQuery<ResultResponse, Error>({
    queryKey: jobId ? queryKeys.result(jobId) : ["result", "idle"],
    queryFn: () => converterApi.getResult(jobId as JobId),
    enabled: Boolean(jobId) && enabled,
    staleTime: Infinity,
  });
}
