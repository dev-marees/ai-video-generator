import { useQuery } from "@tanstack/react-query";
import { converterApi } from "@/api/converter";
import { queryKeys } from "@/api/queryKeys";
import { isProcessingStatus } from "@/lib/status";
import type { JobId, StatusResponse } from "@/types";

const POLL_INTERVAL_MS = 5_000;

/**
 * Polls GET /status/{job_id} every 5 seconds while the job is actively
 * processing. Polling stops automatically once the job reaches a terminal
 * state (completed or failed), or when no job id is provided.
 */
export function useStatus(jobId: JobId | null) {
  return useQuery<StatusResponse, Error>({
    queryKey: jobId ? queryKeys.status(jobId) : ["status", "idle"],
    queryFn: () => converterApi.getStatus(jobId as JobId),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) {
        return POLL_INTERVAL_MS;
      }
      return isProcessingStatus(status) ? POLL_INTERVAL_MS : false;
    },
    refetchIntervalInBackground: true,
  });
}
