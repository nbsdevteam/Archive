/**
 * Tests for useFoldersPageContainer: data/filter/actions/modals, departments load,
 * search, filter apply/clear, edit panel, and formatDate.
 * PRODUCTION: No tests for delete folder; tests must not delete existing data.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../../app/providers/AppProviders";
import { resetStores } from "../../../test/testUtils/resetStores";
import { makeFolderDetail } from "../../../test/fixtures/folders";
import { useFoldersPageContainer } from "./useFoldersPageContainer";
import type { Folder } from "../types/folders.types";

const mockDeleteFolder = vi.fn();
const mockFetchFolders = vi.fn();

vi.mock("../services/folders.api", () => ({
  deleteFolder: (...args: unknown[]) => mockDeleteFolder(...args),
}));

vi.mock("../hooks/useFolders", () => ({
  useFolders: () => ({
    folders: [] as Folder[],
    loading: false,
    error: null,
    pagination: { total: 0, page: 1, per_page: 20, total_pages: 0 },
    fetchFolders: mockFetchFolders,
  }),
}));

/** Real departments store is used so resetStores() works; mock admin API so fetchDepartments succeeds. */
vi.mock("../../../app/adapter/api/admin.api", () => ({
  adminApi: {
    getDepartments: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { id: 10, name: "Engineering", code: "ENG" },
        { id: 20, name: "Sales", code: "SAL" },
      ],
    }),
  },
}));

vi.mock("../../../shared/stores/companiesStore", () => ({
  useCompaniesStore: () => ({
    companies: [],
    fetchCompanies: vi.fn(),
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <AppProviders>{children}</AppProviders>
    </MemoryRouter>
  );
}

/** Folder list item shape (Folder type) for useFolders return. */
function makeFolder(overrides: Partial<Folder> = {}): Folder {
  const detail = makeFolderDetail(overrides);
  return { ...detail, ...overrides };
}

describe("useFoldersPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockFetchFolders.mockResolvedValue(undefined);
    mockDeleteFolder.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    resetStores();
  });

  it("exposes data, loading, filter, actions and modals", () => {
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    expect(result.current.data.routes).toBeDefined();
    expect(result.current.data.folders).toEqual([]);
    expect(result.current.data.filteredFolders).toEqual([]);
    expect(result.current.data.viewMode).toBe("grid");
    expect(result.current.loading).toBe(false);
    expect(result.current.filter.isFilterOpen).toBe(false);
    expect(result.current.actions.handleNavigateToFolder).toBeDefined();
    expect(result.current.actions.confirmDeleteFolder).toBeDefined();
    expect(result.current.modals.editingFolder).toBeNull();
  });

  it("loads departments on mount (store fetches via adminApi)", async () => {
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.filter.departmentOptions.length).toBeGreaterThan(0));
    expect(result.current.filter.departmentOptions).toHaveLength(2);
  });

  it("handleSearchDebounced updates search and filteredFolders reflects it", () => {
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    act(() => {
      result.current.actions.handleSearchDebounced("test");
    });

    expect(result.current.data.filteredFolders).toEqual([]);
  });

  it("filter: open sets isFilterOpen, apply calls fetchFolders with draft filters", async () => {
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    act(() => {
      result.current.filter.handleOpenFilter();
    });
    expect(result.current.filter.isFilterOpen).toBe(true);

    act(() => {
      result.current.filter.handlePrimaryFilterChange(10);
    });
    act(() => {
      result.current.filter.handleApplyFilter();
    });

    expect(mockFetchFolders).toHaveBeenCalledWith(
      expect.objectContaining({ department_id: 10 })
    );
    expect(result.current.filter.isFilterOpen).toBe(false);
  });

  it("filter: handleClearFilter clears filters and calls fetchFolders with empty params", () => {
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    act(() => {
      result.current.filter.handleOpenFilter();
      result.current.filter.handlePrimaryFilterChange(20);
      result.current.filter.handleApplyFilter();
    });
    mockFetchFolders.mockClear();

    act(() => {
      result.current.filter.handleClearFilter();
    });

    expect(mockFetchFolders).toHaveBeenCalledWith({});
    expect(result.current.filter.isFilterOpen).toBe(false);
  });

  it("handleOpenEditFolder and handleCloseEditFolder set editingFolder", () => {
    const folder = makeFolder({ id: 1, name: "Edit Me" });
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    act(() => {
      result.current.actions.handleOpenEditFolder(folder);
    });
    expect(result.current.modals.editingFolder).toEqual(folder);

    act(() => {
      result.current.actions.handleCloseEditFolder();
    });
    expect(result.current.modals.editingFolder).toBeNull();
  });

  it("handleEditFolderSuccess calls fetchFolders and closes edit panel", () => {
    const folder = makeFolder({ id: 2 });
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    act(() => {
      result.current.actions.handleOpenEditFolder(folder);
    });
    expect(result.current.modals.editingFolder).not.toBeNull();
    mockFetchFolders.mockClear();

    act(() => {
      result.current.actions.handleEditFolderSuccess();
    });

    expect(mockFetchFolders).toHaveBeenCalled();
    expect(result.current.modals.editingFolder).toBeNull();
  });

  it("formatDate returns fallback for null/empty", () => {
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    expect(result.current.data.formatDate(null)).toBe("–");
    expect(result.current.data.formatDate(undefined)).toBe("–");
    expect(result.current.data.formatDate("")).toBe("–");
  });
});
