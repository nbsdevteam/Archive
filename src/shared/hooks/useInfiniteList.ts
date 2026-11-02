import { useCallback, useMemo } from "react";
import { useInfiniteQuery, type InfiniteData, type QueryKey } from "@tanstack/react-query";
import { handleApiError } from "@/app/adapter/api/client";

export interface PageMeta {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
}

/**
 * Next page number, or undefined when the list is complete. Some endpoints return total_pages,
 * some only total, and some return everything with no metadata at all (treated as one page).
 */
export function getNextPageNumber(
  meta: PageMeta | null | undefined,
  itemCount: number,
  currentPage: number,
  perPage: number,
): number | undefined {
  if (itemCount === 0 || !meta) return undefined;
  if (meta.total_pages != null && meta.total_pages > 0) {
    return currentPage < meta.total_pages ? currentPage + 1 : undefined;
  }
  if (meta.total != null && meta.total > 0) {
    return currentPage * (meta.per_page || perPage) < meta.total ? currentPage + 1 : undefined;
  }
  return undefined;
}

export interface UseInfiniteListOptions<TPage, TItem> {
  queryKey: QueryKey;
  perPage: number;
  fetchPage: (page: number, perPage: number) => Promise<TPage>;
  getItems: (page: TPage) => TItem[] | null | undefined;
  getMeta: (page: TPage) => PageMeta | null | undefined;
  /** Rows can shift across page boundaries between requests; duplicates would collide as React keys. */
  getItemId: (item: TItem) => string | number;
  enabled?: boolean;
  staleTime?: number;
  getErrorMessage?: (error: unknown) => string;
}

/** Paging state the UI needs; pass straight to InfiniteScrollFooter. */
export interface InfiniteListPaging {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** The last "load more" failed; rows already loaded remain usable. */
  loadMoreFailed: boolean;
  fetchNextPage: () => void;
  loadedCount: number;
  total: number;
}

/** Page-numbered list endpoint as one growing, de-duplicated, cached array of rows. */
export function useInfiniteList<TPage, TItem>({
  queryKey,
  perPage,
  fetchPage,
  getItems,
  getMeta,
  getItemId,
  enabled = true,
  staleTime,
  getErrorMessage = handleApiError,
}: UseInfiniteListOptions<TPage, TItem>) {
  const query = useInfiniteQuery<TPage, Error, InfiniteData<TPage, number>, QueryKey, number>({
    queryKey,
    enabled,
    // An explicit undefined would override the client's default staleTime, disabling the cache.
    ...(staleTime !== undefined ? { staleTime } : {}),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage(pageParam, perPage),
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      getNextPageNumber(getMeta(lastPage), getItems(lastPage)?.length ?? 0, lastPageParam, perPage),
  });

  const pages = query.data?.pages;

  const items = useMemo(() => {
    if (!pages) return [] as TItem[];
    const seen = new Set<string | number>();
    const merged: TItem[] = [];
    for (const page of pages) {
      for (const item of getItems(page) ?? []) {
        const id = getItemId(item);
        if (seen.has(id)) continue;
        seen.add(id);
        merged.push(item);
      }
    }
    return merged;
    // getItems/getItemId are pure accessors; only the fetched pages decide the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);

  const total = useMemo(() => {
    const meta = pages?.length ? getMeta(pages[pages.length - 1]) : undefined;
    return meta?.total && meta.total > 0 ? Math.max(meta.total, items.length) : items.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, items.length]);

  const { fetchNextPage: rawFetchNextPage, refetch: rawRefetch } = query;

  /** cancelRefetch: false joins a request already in flight rather than restarting it. */
  const fetchNextPage = useCallback(() => {
    void rawFetchNextPage({ cancelRefetch: false });
  }, [rawFetchNextPage]);

  const refetch = useCallback(() => rawRefetch({ cancelRefetch: false }), [rawRefetch]);

  const firstPage = pages?.[0];
  const loadMoreFailed = query.isFetchNextPageError;
  const error = query.isError && !loadMoreFailed ? getErrorMessage(query.error) : null;

  const paging: InfiniteListPaging = {
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMoreFailed,
    fetchNextPage,
    loadedCount: items.length,
    total,
  };

  return {
    items,
    firstPage,
    total,
    /** True only while the first page of this key has nothing to show (not on background refetch). */
    loading: query.isLoading,
    isRefetching: query.isRefetching,
    error,
    refetch,
    paging,
  };
}
