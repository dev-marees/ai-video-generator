import { QueryClient } from "@tanstack/react-query";

/**
 * Shared React Query client. Conservative retry/staleTime defaults suited
 * to a polling-heavy app; individual queries override as needed.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
    mutations: {
      retry: 0,
    },
  },
});
