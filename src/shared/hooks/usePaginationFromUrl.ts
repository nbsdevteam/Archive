import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const PAGE_KEY = "page";
const PER_PAGE_KEY = "per_page";

/**
 * Syncs pagination state (page, per_page) to URL query params so refresh/back/forward preserve it.
 * Merges updates with existing search params (e.g. q, filters) without wiping them.
 *
 * @param defaultPerPage - Default items per page when param is missing (e.g. 20 for documents).
 * @returns page, perPage, setPage, setPerPage, and resetPage (convenience to go to 1 after filter change).
 */
export function usePaginationFromUrl(defaultPerPage: number = 20) {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = useMemo(() => {
    const p = searchParams.get(PAGE_KEY);
    const n = p != null ? Number(p) : 1;
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }, [searchParams]);

  const perPage = useMemo(() => {
    const p = searchParams.get(PER_PAGE_KEY);
    const n = p != null ? Number(p) : defaultPerPage;
    return Number.isFinite(n) && n >= 1 ? n : defaultPerPage;
  }, [searchParams, defaultPerPage]);

  const updateParams = useCallback(
    (updates: { page?: number; per_page?: number }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (updates.page != null) next.set(PAGE_KEY, String(updates.page));
          if (updates.per_page != null) next.set(PER_PAGE_KEY, String(updates.per_page));
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      updateParams({ page: Math.max(1, nextPage) });
    },
    [updateParams]
  );

  const setPerPage = useCallback(
    (nextPerPage: number) => {
      updateParams({ per_page: Math.max(1, nextPerPage), page: 1 });
    },
    [updateParams]
  );

  const resetPage = useCallback(() => {
    updateParams({ page: 1 });
  }, [updateParams]);

  return { page, perPage, setPage, setPerPage, resetPage };
}
