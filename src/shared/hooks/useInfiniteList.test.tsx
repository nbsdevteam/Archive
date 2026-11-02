import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { getNextPageNumber, useInfiniteList, type PageMeta } from "./useInfiniteList";

interface Row {
  id: number;
}
interface Page {
  data: Row[];
  pagination?: PageMeta;
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

function renderList(fetchPage: (page: number, perPage: number) => Promise<Page>) {
  return renderHook(
    () =>
      useInfiniteList<Page, Row>({
        queryKey: ["test-list"],
        perPage: 2,
        fetchPage,
        getItems: (page) => page.data,
        getMeta: (page) => page.pagination,
        getItemId: (row) => row.id,
      }),
    { wrapper },
  );
}

describe("getNextPageNumber", () => {
  it("uses total_pages when the API sends it", () => {
    expect(getNextPageNumber({ total_pages: 3 }, 20, 1, 20)).toBe(2);
    expect(getNextPageNumber({ total_pages: 3 }, 20, 3, 20)).toBeUndefined();
  });

  it("derives the end from total when total_pages is missing (audit logs)", () => {
    expect(getNextPageNumber({ total: 120 }, 50, 2, 50)).toBe(3);
    expect(getNextPageNumber({ total: 100 }, 50, 2, 50)).toBeUndefined();
  });

  it("prefers the page size the server reports over the one requested", () => {
    expect(getNextPageNumber({ total: 40, per_page: 10 }, 10, 3, 50)).toBe(4);
  });

  it("treats a response with no metadata as the complete list", () => {
    expect(getNextPageNumber(undefined, 500, 1, 20)).toBeUndefined();
    expect(getNextPageNumber({ total_pages: 0, total: 0 }, 500, 1, 20)).toBeUndefined();
  });

  it("stops on an empty page even if the metadata claims more", () => {
    expect(getNextPageNumber({ total_pages: 9 }, 0, 2, 20)).toBeUndefined();
  });
});

describe("useInfiniteList", () => {
  it("appends the next page and reports totals", async () => {
    const fetchPage = vi.fn(async (page: number): Promise<Page> => ({
      data: page === 1 ? [{ id: 1 }, { id: 2 }] : [{ id: 3 }],
      pagination: { total: 3, total_pages: 2 },
    }));
    const { result } = renderList(fetchPage);

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.paging.hasNextPage).toBe(true);
    expect(result.current.paging.total).toBe(3);

    act(() => result.current.paging.fetchNextPage());

    await waitFor(() => expect(result.current.items.map((r) => r.id)).toEqual([1, 2, 3]));
    expect(result.current.paging.hasNextPage).toBe(false);
    expect(fetchPage).toHaveBeenCalledWith(2, 2);
  });

  it("drops a row that shifted onto the next page, keeping keys unique", async () => {
    const fetchPage = vi.fn(async (page: number): Promise<Page> => ({
      data: page === 1 ? [{ id: 1 }, { id: 2 }] : [{ id: 2 }, { id: 3 }],
      pagination: { total_pages: 2 },
    }));
    const { result } = renderList(fetchPage);

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    act(() => result.current.paging.fetchNextPage());

    await waitFor(() => expect(result.current.items.map((r) => r.id)).toEqual([1, 2, 3]));
  });

  it("keeps loaded rows and flags load-more when a later page fails", async () => {
    const fetchPage = vi.fn(async (page: number): Promise<Page> => {
      if (page === 2) throw new Error("boom");
      return { data: [{ id: 1 }, { id: 2 }], pagination: { total_pages: 2 } };
    });
    const { result } = renderList(fetchPage);

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    act(() => result.current.paging.fetchNextPage());

    await waitFor(() => expect(result.current.paging.loadMoreFailed).toBe(true));
    expect(result.current.items).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(result.current.paging.hasNextPage).toBe(true);
  });

  it("reports a first-page failure as an error", async () => {
    const { result } = renderList(async () => {
      throw new Error("boom");
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("serves a remount from cache without another request", async () => {
    const fetchPage = vi.fn(async (): Promise<Page> => ({ data: [{ id: 1 }] }));
    const first = renderList(fetchPage);
    await waitFor(() => expect(first.result.current.items).toHaveLength(1));
    first.unmount();

    const second = renderList(fetchPage);

    expect(second.result.current.items).toHaveLength(1);
    expect(second.result.current.loading).toBe(false);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
