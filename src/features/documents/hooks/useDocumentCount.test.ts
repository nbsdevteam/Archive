/**
 * Tests for useDocumentCount: fetch on mount with params, initialParams (e.g. archived),
 * refetch, and error handling.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/queryClient";
import { useDocumentCount } from "./useDocumentCount";

const mockGetDocuments = vi.fn();

vi.mock("../../../app/adapter/api/documents.api", () => ({
  documentsApi: {
    getDocuments: (...args: unknown[]) => mockGetDocuments(...args),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: queryClient }, children);

describe("useDocumentCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDocuments.mockResolvedValue({
      data: [],
      pagination: { total: 42, page: 1, per_page: 1, total_pages: 42 },
    });
  });

  it("fetches count on mount using default active status", async () => {
    const { result } = renderHook(() => useDocumentCount({}), { wrapper });

    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    expect(mockGetDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        per_page: 1,
        page: 1,
      })
    );
    await waitFor(() => expect(result.current.count).toBe(42));
    expect(result.current.loading).toBe(false);
  });

  it("uses initialParams when provided (e.g. archived)", async () => {
    const { result } = renderHook(() =>
      useDocumentCount({
        initialParams: { status: "archived", per_page: 1, page: 1 },
      })
    , { wrapper });

    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    expect(mockGetDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "archived",
        per_page: 1,
        page: 1,
      })
    );
    await waitFor(() => expect(result.current.count).toBe(42));
  });

  it("refetch calls getDocuments again", async () => {
    const { result } = renderHook(() => useDocumentCount({}), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(42));
    mockGetDocuments.mockClear();
    mockGetDocuments.mockResolvedValue({
      data: [],
      pagination: { total: 50, page: 1, per_page: 1, total_pages: 50 },
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.count).toBe(50));
  });

  it("sets count to 0 on API error", async () => {
    mockGetDocuments.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useDocumentCount({}), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.count).toBe(0);
  });
});
