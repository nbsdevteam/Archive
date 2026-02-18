import { useMemo } from "react";
import { computeTotalPages } from "@/shared/utils/pagination";

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/**
 * Client-side pagination fallback. When the backend returns all items without
 * pagination metadata, this hook slices the array for the current page and
 * builds the pagination object locally. If the backend already provides a
 * `serverPagination` object, it is returned as-is (server takes precedence).
 */
export function useClientPagination<T>(
  allItems: T[],
  page: number,
  perPage: number,
  serverPagination?: PaginationMeta | undefined | null,
) {
  const total = allItems.length;

  const hasServerPagination = !!(
    serverPagination &&
    serverPagination.total_pages > 0
  );

  const pagination: PaginationMeta = useMemo(() => {
    if (hasServerPagination) return serverPagination!;
    const totalPages = computeTotalPages(total, perPage);
    return { page, per_page: perPage, total, total_pages: totalPages };
  }, [hasServerPagination, serverPagination, total, perPage, page]);

  const paginatedItems: T[] = useMemo(() => {
    if (hasServerPagination) return allItems;
    const start = (page - 1) * perPage;
    return allItems.slice(start, start + perPage);
  }, [hasServerPagination, allItems, page, perPage]);

  return { paginatedItems, pagination };
}
