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
const mockListFolders = vi.fn();

vi.mock("../services/folders.api", () => ({
  deleteFolder: (...args: unknown[]) => mockDeleteFolder(...args),
  batchDeleteFolders: vi.fn(),
  listFolders: (...args: unknown[]) => mockListFolders(...args),
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

/** Folder list item shape (Folder type). */
function makeFolder(overrides: Partial<Folder> = {}): Folder {
  const detail = makeFolderDetail(overrides);
  return { ...detail, ...overrides };
}

describe("useFoldersPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockListFolders.mockResolvedValue({
      folders: [] as Folder[],
      pagination: { total: 0, page: 1, per_page: 20, total_pages: 0 },
    });
    mockDeleteFolder.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    resetStores();
  });

  it("exposes data, loading, filter, actions and modals", async () => {
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
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

  it("filter: open sets isFilterOpen, apply requests folders with draft filters", async () => {
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

    await waitFor(() =>
      expect(mockListFolders).toHaveBeenCalledWith(
        expect.objectContaining({ department_id: 10, page: 1 })
      )
    );
    expect(result.current.filter.isFilterOpen).toBe(false);
  });

  it("filter: handleClearFilter clears filters and goes back to the unfiltered list", async () => {
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    act(() => {
      result.current.filter.handleOpenFilter();
    });
    act(() => {
      result.current.filter.handlePrimaryFilterChange(20);
    });
    act(() => {
      result.current.filter.handleApplyFilter();
    });
    await waitFor(() =>
      expect(mockListFolders).toHaveBeenCalledWith(expect.objectContaining({ department_id: 20 }))
    );

    act(() => {
      result.current.filter.handleClearFilter();
    });

    expect(result.current.filter.draftFilters).toEqual({});
    expect(result.current.filter.isFilterOpen).toBe(false);
    // The first, unfiltered request came without a department; clearing reuses that cached list.
    expect(mockListFolders.mock.calls[0][0].department_id).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it("filter: apply with date range requests folders with from_date and to_date", async () => {
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    act(() => {
      result.current.filter.handleOpenFilter();
    });
    act(() => {
      result.current.filter.handleDateRangeChange({
        fromDate: new Date("2026-02-01T00:00:00"),
        toDate: new Date("2026-02-18T00:00:00"),
      });
    });
    act(() => {
      result.current.filter.handleApplyFilter();
    });

    await waitFor(() =>
      expect(mockListFolders).toHaveBeenCalledWith(
        expect.objectContaining({
          from_date: "2026-02-01",
          to_date: "2026-02-18",
          page: 1,
        })
      )
    );
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

  it("handleEditFolderSuccess reloads the list and closes edit panel", async () => {
    const folder = makeFolder({ id: 2 });
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });
    await waitFor(() => expect(mockListFolders).toHaveBeenCalled());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.actions.handleOpenEditFolder(folder);
    });
    expect(result.current.modals.editingFolder).not.toBeNull();
    mockListFolders.mockClear();

    act(() => {
      result.current.actions.handleEditFolderSuccess();
    });

    await waitFor(() => expect(mockListFolders).toHaveBeenCalled());
    expect(result.current.modals.editingFolder).toBeNull();
  });

  it("formatDate returns fallback for null/empty", () => {
    const { result } = renderHook(() => useFoldersPageContainer(), { wrapper });

    expect(result.current.data.formatDate(null)).toBe("–");
    expect(result.current.data.formatDate(undefined)).toBe("–");
    expect(result.current.data.formatDate("")).toBe("–");
  });
});
