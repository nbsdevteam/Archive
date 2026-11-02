import { QueryClient } from "@tanstack/react-query";

/** List data: reused when returning to a page shortly after leaving it. */
export const LIST_STALE_TIME_MS = 30_000;
/** Lookup data that rarely changes (departments, companies, document types, tags). */
export const REFERENCE_STALE_TIME_MS = 5 * 60_000;

/**
 * Single app-wide client. It is a module singleton (not created in a component) so zustand stores
 * and invalidation helpers can reach the same cache as hooks.
 *
 * - retry: false keeps the previous behaviour of surfacing a failed request immediately.
 * - networkMode "always": the default pauses requests when navigator.onLine is false, which
 *   would leave an intranet deployment stuck on a spinner forever.
 * - refetchOnWindowFocus: false so an infinite list does not refetch every loaded page on tab switch.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: LIST_STALE_TIME_MS,
      gcTime: 5 * 60_000,
      retry: false,
      refetchOnWindowFocus: false,
      networkMode: "always",
    },
    mutations: {
      networkMode: "always",
    },
  },
});

/** Drops all cached server data. Must run on logout so one user's data never reaches the next. */
export function clearQueryCache(): void {
  queryClient.clear();
}
