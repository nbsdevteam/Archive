/**
 * Tests for useTrashDocumentCount: fetch trash count on mount, refetch, and error handling.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/queryClient";
import { useTrashDocumentCount } from "./useTrashDocumentCount";

const mockListTrashDocuments = vi.fn();

vi.mock("@/app/adapter/api/documents", () => ({
  getTrashDocuments: (...args: unknown[]) => mockListTrashDocuments(...args),
}));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

describe("useTrashDocumentCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTrashDocuments.mockResolvedValue({
      data: [],
      pagination: { total: 12, page: 1, per_page: 1, total_pages: 12 },
    });
  });

  it("fetches trash count on mount with minimal params", async () => {
    const { result } = renderHook(() => useTrashDocumentCount(), { wrapper });

    await waitFor(() => expect(mockListTrashDocuments).toHaveBeenCalled());
    expect(mockListTrashDocuments).toHaveBeenCalledWith({
      page: 1,
      per_page: 1,
    });
    await waitFor(() => expect(result.current.count).toBe(12));
    expect(result.current.loading).toBe(false);
  });

  it("refetch calls listTrashDocuments again", async () => {
    const { result } = renderHook(() => useTrashDocumentCount(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(12));
    mockListTrashDocuments.mockClear();
    mockListTrashDocuments.mockResolvedValue({
      data: [],
      pagination: { total: 8, page: 1, per_page: 1, total_pages: 8 },
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.count).toBe(8));
  });

  it("sets count to 0 on API error", async () => {
    mockListTrashDocuments.mockRejectedValue(new Error("Forbidden"));

    const { result } = renderHook(() => useTrashDocumentCount(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.count).toBe(0);
  });
});
