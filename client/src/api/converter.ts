import { apiClient } from "./client";
import type {
  GenerateResponse,
  JobId,
  ResultResponse,
  SlidesResponse,
  StatusResponse,
  UploadResponse,
} from "@/types";

/**
 * Service layer for the Universal File Converter backend.
 * Each function maps to a single backend endpoint and returns typed data.
 */
export const converterApi = {
  /** POST /upload — upload a markdown file, returns the created job id. */
  async upload(
    file: File,
    onUploadProgress?: (percent: number) => void,
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await apiClient.post<UploadResponse>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onUploadProgress && event.total) {
          onUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
    return data;
  },

  /** GET /slides/{job_id} — fetch slide previews for a job. */
  async getSlides(jobId: JobId): Promise<SlidesResponse> {
    const { data } = await apiClient.get<SlidesResponse>(`/slides/${jobId}`);
    return data;
  },

  /** POST /generate/{job_id} — start video generation for a job. */
  async generate(jobId: JobId): Promise<GenerateResponse> {
    const { data } = await apiClient.post<GenerateResponse>(
      `/generate/${jobId}`,
    );
    return data;
  },

  /** GET /status/{job_id} — poll the current job status. */
  async getStatus(jobId: JobId): Promise<StatusResponse> {
    const { data } = await apiClient.get<StatusResponse>(`/status/${jobId}`);
    return data;
  },

  /** GET /result/{job_id} — fetch the rendered video result. */
  async getResult(jobId: JobId): Promise<ResultResponse> {
    const { data } = await apiClient.get<ResultResponse>(`/result/${jobId}`);
    return data;
  },

  /** Helper to get the audio preview URL for a slide. */
  getAudioUrl(jobId: JobId, index: number): string {
    // The apiClient baseURL is ideally handled, but since it's used in <audio src={...}>
    // we return a standard relative path if not using absolute URLs.
    return `/api/audio/${jobId}/${index}`;
  },
};
