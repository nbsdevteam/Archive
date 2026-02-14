/**
 * Tests for useDashboardPageContainer: stats fetch, counts (active/archived/trashed),
 * folders, upload panel, refreshDashboardCounts, and error handling.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { AppProviders } from "../../../app/providers/AppProviders";
import { resetStores } from "../../../test/testUtils/resetStores";
import { useDashboardPageContainer } from "./useDashboardPageContainer";

const mockGetDashboardStats = vi.fn();
const mockFetchFolders = vi.fn();
const mockRefetchArchivedCount = vi.fn();
const mockRefetchTrashedCount = vi.fn();

vi.mock("../../../app/adapter/api/admin.api", () => ({
  adminApi: {
    getDashboardStats: (...args: unknown[]) => mockGetDashboardStats(...args),
  },
}));

vi.mock("../../folders/hooks/useFolders", () => ({
  useFolders: () => ({
    folders: [],
    loading: false,
    error: null,
    pagination: { total: 5, page: 1, per_page: 10, total_pages: 1 },
    fetchFolders: mockFetchFolders,
  }),
}));

vi.mock("../../documents/hooks", () => ({
  useDocumentCount: () => ({
    count: 3,
    refetch: mockRefetchArchivedCount,
  }),
  useTrashDocumentCount: () => ({
    count: 1,
    refetch: mockRefetchTrashedCount,
  }),
}));

vi.mock("../../notifications/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}

describe("useDashboardPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockGetDashboardStats.mockResolvedValue({
      total_documents: 10,
      by_department: [
        { department: "Engineering", count: 6 },
        { department: "Sales", count: 4 },
      ],
    });
  });

  afterEach(() => {
    resetStores();
  });

  it("fetches dashboard stats on mount and exposes stats", async () => {
    const { result } = renderHook(() => useDashboardPageContainer(), { wrapper });

    await waitFor(() => expect(mockGetDashboardStats).toHaveBeenCalled());
    await waitFor(() =>
      expect(result.current.stats).toEqual({
        total_documents: 10,
        by_department: [
          { department: "Engineering", count: 6 },
          { department: "Sales", count: 4 },
        ],
      })
    );
    expect(result.current.statsError).toBeNull();
  });

  it("exposes activeDocumentsCount from stats.total_documents", async () => {
    const { result } = renderHook(() => useDashboardPageContainer(), { wrapper });

    await waitFor(() => expect(result.current.stats).not.toBeNull());
    expect(result.current.activeDocumentsCount).toBe(10);
  });

  it("exposes archivedDocumentsCount and trashedDocumentsCount from count hooks", async () => {
    const { result } = renderHook(() => useDashboardPageContainer(), { wrapper });

    await waitFor(() => expect(result.current.stats).not.toBeNull());
    expect(result.current.archivedDocumentsCount).toBe(3);
    expect(result.current.trashedDocumentsCount).toBe(1);
  });

  it("exposes totalFolders from folders pagination", async () => {
    const { result } = renderHook(() => useDashboardPageContainer(), { wrapper });

    await waitFor(() => expect(result.current.stats).not.toBeNull());
    expect(result.current.totalFolders).toBe(5);
  });

  it("exposes documentsByDepartment from stats", async () => {
    const { result } = renderHook(() => useDashboardPageContainer(), { wrapper });

    await waitFor(() => expect(result.current.stats).not.toBeNull());
    expect(result.current.documentsByDepartment).toHaveLength(2);
    expect(result.current.documentsByDepartment[0]).toEqual({
      department: "Engineering",
      count: 6,
    });
  });

  it("refreshDashboardCounts calls fetchFolders, fetchDashboardStats, refetchArchivedCount, refetchTrashedCount", async () => {
    const { result } = renderHook(() => useDashboardPageContainer(), { wrapper });
    await waitFor(() => expect(mockGetDashboardStats).toHaveBeenCalled());
    mockGetDashboardStats.mockClear();
    mockFetchFolders.mockClear();
    mockRefetchArchivedCount.mockClear();
    mockRefetchTrashedCount.mockClear();

    act(() => {
      result.current.refreshDashboardCounts();
    });

    expect(mockFetchFolders).toHaveBeenCalled();
    expect(mockGetDashboardStats).toHaveBeenCalled();
    expect(mockRefetchArchivedCount).toHaveBeenCalled();
    expect(mockRefetchTrashedCount).toHaveBeenCalled();
  });

  it("upload panel open/close toggles uploadPanelOpen", async () => {
    const { result } = renderHook(() => useDashboardPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.stats).not.toBeNull());
    expect(result.current.uploadPanelOpen).toBe(false);

    act(() => {
      result.current.handleOpenUploadPanel();
    });
    expect(result.current.uploadPanelOpen).toBe(true);

    act(() => {
      result.current.handleCloseUploadPanel();
    });
    expect(result.current.uploadPanelOpen).toBe(false);
  });

  it("sets statsError when getDashboardStats fails", async () => {
    mockGetDashboardStats.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useDashboardPageContainer(), { wrapper });

    await waitFor(() => expect(result.current.statsError).toBeTruthy());
    expect(result.current.statsError).toBeTruthy();
  });

  it("accepts stats in nested stats property from API", async () => {
    mockGetDashboardStats.mockResolvedValue({
      stats: {
        total_documents: 7,
        by_department: [{ department: "HR", count: 7 }],
      },
    });

    const { result } = renderHook(() => useDashboardPageContainer(), { wrapper });

    await waitFor(() => expect(result.current.stats).not.toBeNull());
    expect(result.current.activeDocumentsCount).toBe(7);
    expect(result.current.documentsByDepartment).toHaveLength(1);
    expect(result.current.documentsByDepartment[0].department).toBe("HR");
  });
});
