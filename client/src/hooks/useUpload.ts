import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { converterApi } from "@/api/converter";
import type { UploadResponse } from "@/types";

/**
 * Uploads a markdown file via POST /upload and exposes upload progress.
 * Returns the standard React Query mutation plus a 0-100 progress value.
 */
export function useUpload() {
  const [progress, setProgress] = useState<number>(0);

  const mutation = useMutation<UploadResponse, Error, File>({
    mutationFn: (file: File) => {
      setProgress(0);
      return converterApi.upload(file, setProgress);
    },
  });

  return { ...mutation, progress };
}
