import axios, { AxiosError, type AxiosInstance } from "axios";

/**
 * Shape of a structured error payload the backend may return.
 */
interface ApiErrorBody {
  message?: string;
  error?: string;
}

/**
 * Pre-configured Axios instance. Base URL is read from the Vite env
 * (VITE_API_BASE_URL); defaults to "/api" which the dev server proxies
 * to the backend (see vite.config.ts).
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  headers: {
    Accept: "application/json",
  },
  timeout: 30_000,
});

/**
 * Normalize Axios/network errors into a readable Error so the UI can
 * surface a meaningful message regardless of the failure source.
 */
export function toApiError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    const data = axiosError.response?.data;
    const serverMessage = data?.message ?? data?.error;
    if (serverMessage) {
      return new Error(serverMessage);
    }
    if (axiosError.response) {
      return new Error(
        `Request failed with status ${axiosError.response.status}`,
      );
    }
    if (axiosError.code === "ECONNABORTED") {
      return new Error("The request timed out. Please try again.");
    }
    return new Error(
      "Could not reach the server. Check your connection and try again.",
    );
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error("An unexpected error occurred.");
}

// Convert all rejected responses into normalized Errors at the boundary.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);
