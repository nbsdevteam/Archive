/**
 * Tests for useSearchPageContainer: search query/type, standard/global/barcode search,
 * clear results, retry, and navigate to document.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useSearchPageContainer } from "./useSearchPageContainer";

const mockSearch = vi.fn();
const mockGlobalSearch = vi.fn();
const mockSearchByBarcode = vi.fn();
const mockClearResults = vi.fn();
const mockClearError = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()],
  };
});

/** Mock useDebounce to return value immediately so effects run without waiting. */
vi.mock("../../../shared/hooks/useDebounce", () => ({
  useDebounce: <T,>(value: T) => value,
}));

vi.mock("../stores/searchStore", () => ({
  useSearchStore: vi.fn(),
}));

import { useSearchStore } from "../stores/searchStore";

function createMockStore(overrides: {
  results?: unknown[];
  isLoading?: boolean;
  error?: string | null;
} = {}) {
  return {
    results: overrides.results ?? [],
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
    search: mockSearch,
    globalSearch: mockGlobalSearch,
    searchByBarcode: mockSearchByBarcode,
    clearResults: mockClearResults,
    clearError: mockClearError,
    ...overrides,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("useSearchPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchStore as ReturnType<typeof vi.fn>).mockImplementation(() => createMockStore());
  });

  it("exposes routes, searchQuery, searchType and handlers", () => {
    const { result } = renderHook(() => useSearchPageContainer(), { wrapper });

    expect(result.current.routes).toBeDefined();
    expect(result.current.searchQuery).toBe("");
    expect(result.current.searchType).toBe("standard");
    expect(typeof result.current.setSearchType).toBe("function");
    expect(typeof result.current.handleSearchChange).toBe("function");
    expect(typeof result.current.handleSearchKeyDown).toBe("function");
    expect(typeof result.current.handleRetry).toBe("function");
    expect(typeof result.current.handleNavigateToDocument).toBe("function");
  });

  it("updates searchQuery when handleSearchChange is called", () => {
    const { result } = renderHook(() => useSearchPageContainer(), { wrapper });

    act(() => {
      result.current.handleSearchChange({
        target: { value: "test query" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.searchQuery).toBe("test query");
  });

  it("calls search with trimmed query when debounced query has length >= 1 (standard)", async () => {
    const { result } = renderHook(() => useSearchPageContainer(), { wrapper });

    act(() => {
      result.current.handleSearchChange({
        target: { value: "  doc  " },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() => expect(mockSearch).toHaveBeenCalledWith({ query: "doc", search_in_content: false }));
  });

  it("calls globalSearch when searchType is global", async () => {
    const { result } = renderHook(() => useSearchPageContainer(), { wrapper });

    act(() => {
      result.current.setSearchType("global");
    });
    act(() => {
      result.current.handleSearchChange({
        target: { value: "foo" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() =>
      expect(mockGlobalSearch).toHaveBeenCalledWith({
        query: "foo",
        search_in_content: true,
        fuzzy: true,
      })
    );
  });

  it("calls searchByBarcode when searchType is barcode", async () => {
    const { result } = renderHook(() => useSearchPageContainer(), { wrapper });

    act(() => {
      result.current.setSearchType("barcode");
    });
    act(() => {
      result.current.handleSearchChange({
        target: { value: "BAR-123" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() => expect(mockSearchByBarcode).toHaveBeenCalledWith("BAR-123"));
  });

  it("calls clearResults when debounced query is empty", async () => {
    const { result } = renderHook(() => useSearchPageContainer(), { wrapper });

    act(() => {
      result.current.handleSearchChange({ target: { value: "x" } } as React.ChangeEvent<HTMLInputElement>);
    });
    await waitFor(() => expect(mockSearch).toHaveBeenCalled());
    mockClearResults.mockClear();

    act(() => {
      result.current.handleSearchChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
    });

    await waitFor(() => expect(mockClearResults).toHaveBeenCalled());
  });

  it("handleRetry calls clearError and re-runs search when searchQuery has value", () => {
    (useSearchStore as ReturnType<typeof vi.fn>).mockImplementation(() =>
      createMockStore({ error: "Something failed", results: [] })
    );
    const { result } = renderHook(() => useSearchPageContainer(), { wrapper });

    act(() => {
      result.current.handleSearchChange({ target: { value: "retry" } } as React.ChangeEvent<HTMLInputElement>);
    });
    mockClearError.mockClear();
    mockSearch.mockClear();

    act(() => {
      result.current.handleRetry();
    });

    expect(mockClearError).toHaveBeenCalled();
    expect(mockSearch).toHaveBeenCalledWith({ query: "retry", search_in_content: false });
  });

  it("handleNavigateToDocument navigates to document detail route", () => {
    const { result } = renderHook(() => useSearchPageContainer(), { wrapper });
    expect(result.current.routes.documentDetail).toBeDefined();

    act(() => {
      result.current.handleNavigateToDocument(99);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/documents/99");
  });
});
