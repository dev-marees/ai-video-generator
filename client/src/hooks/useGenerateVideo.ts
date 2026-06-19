import { useMutation, useQueryClient } from "@tanstack/react-query";
import { converterApi } from "@/api/converter";
import { queryKeys } from "@/api/queryKeys";
import type { GenerateResponse, JobId } from "@/types";

/**
 * Triggers video generation via POST /generate/{job_id}.
 * On success, invalidates the status query so polling reflects the new state.
 */
export function useGenerateVideo(jobId: JobId | null) {
  const queryClient = useQueryClient();

  return useMutation<GenerateResponse, Error, void>({
    mutationFn: () => converterApi.generate(jobId as JobId),
    onSuccess: () => {
      if (jobId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.status(jobId),
        });
      }
    },
  });
}
