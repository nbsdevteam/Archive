import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { all_routes } from "@/router/all_routes";
import { useDepartmentsStore } from "@/shared/stores/departmentsStore";
import { useCompaniesStore } from "@/shared/stores/companiesStore";
import { useDraftAppliedFilters, useSelection } from "@/shared/hooks";
import { useInfiniteList } from "@/shared/hooks/useInfiniteList";
import { queryKeys } from "@/shared/lib/queryKeys";
import { invalidateFolderData } from "@/shared/lib/queryInvalidation";
import { handleApiError } from "@/app/adapter/api/client";
import type { DateRangeMode, SelectOption } from "@/shared/components/ui";
import { FOLDER_TYPE_VALUES } from "@/shared/constants/folderTypeOptions";
import { deleteFolder, batchDeleteFolders, listFolders } from "@/features/folders/services/folders.api";
import type { Folder } from "@/features/folders/types/folders.types";
import { filterFoldersBySearch } from "@/features/folders/utils/filterFoldersBySearch";
import { getFolderStatusBadgeVariant } from "@/features/folders/utils/getFolderStatusBadgeVariant";
import { saveFolderToCache } from "@/features/folders/utils/folderNavigationCache";

const FOLDERS_PAGE_SIZE = 20;
const VIEW_MODE = { grid: "grid", list: "list" } as const;
type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

function toDateOnlyString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateOnly(s: string | undefined): Date | null {
  if (!s || s.trim() === "") return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function deriveDateMode(f: FoldersFilterState): DateRangeMode {
  if (f.from_date && f.to_date) return "between";
  if (f.from_date) return "after";
  if (f.to_date) return "upto";
  return "after";
}

export interface FoldersFilterState {
  department_id?: number;
  folder_type?: string;
  company_id?: number;
  from_date?: string;
  to_date?: string;
  date_mode?: DateRangeMode;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  const apiMessage = handleApiError(error);
  return apiMessage !== "An unexpected error occurred" ? apiMessage : fallback;
}

/**
 * Container for the Folders list page: filter state, view mode, search, infinite list, and folder CRUD.
 * Composes useDraftAppliedFilters and useInfiniteList; returns data, filter, actions, and edit panel state.
 */
export function useFoldersPageContainer() {
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.grid);
  const [searchQuery, setSearchQuery] = useState("");
  /** Keep all useState at the top so hook order never shifts vs callbacks/effects (avoids invalid-hook-call on recovery). */
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const filterState = useDraftAppliedFilters<FoldersFilterState>();
  const {
    appliedFilters,
    draftFilters,
    setDraftFilters,
    isFilterOpen,
    filterApplyDisabled,
    handleOpenFilter: baseHandleOpenFilter,
    handleCloseFilter,
    handleApplyFilter: baseHandleApplyFilter,
    handleClearFilter: baseHandleClearFilter,
  } = filterState;

  /** API params: active state + applied filters + date range when set. */
  const listParams = useMemo(
    () => ({
      state: "active" as const,
      department_id: appliedFilters.department_id,
      folder_type: appliedFilters.folder_type,
      company_id: appliedFilters.company_id,
      ...(appliedFilters.from_date != null && appliedFilters.from_date !== "" && { from_date: appliedFilters.from_date }),
      ...(appliedFilters.to_date != null && appliedFilters.to_date !== "" && { to_date: appliedFilters.to_date }),
    }),
    [
      appliedFilters.department_id,
      appliedFilters.folder_type,
      appliedFilters.company_id,
      appliedFilters.from_date,
      appliedFilters.to_date,
    ]
  );

  const {
    items: folders,
    loading,
    error,
    refetch,
    paging,
  } = useInfiniteList({
    queryKey: queryKeys.folders.infinite({ ...listParams, per_page: FOLDERS_PAGE_SIZE }),
    perPage: FOLDERS_PAGE_SIZE,
    fetchPage: (page, per_page) => listFolders({ ...listParams, page, per_page }),
    getItems: (response) => response.folders,
    getMeta: (response) => response.pagination,
    getItemId: (folder: Folder) => folder.id,
    getErrorMessage: (e) => (e instanceof Error && e.message ? e.message : "Failed to load folders"),
  });

  const filteredFolders = useMemo(
    () => filterFoldersBySearch(folders, searchQuery),
    [folders, searchQuery]
  );

  const getFolderId = useCallback((f: Folder) => f.id, []);

  /** Selection state for batch operations */
  const {
    selectedIds: selectedFolderIdsRaw,
    selectionConfig: baseSelectionConfig,
    clear: clearSelection,
  } = useSelection<Folder>(filteredFolders, getFolderId);

  const selectedFolderIds = useMemo(
    () => selectedFolderIdsRaw.map((id) => Number(id)),
    [selectedFolderIdsRaw]
  );

  const isSomeSelected = selectedFolderIds.length > 0;

  const selectionConfig = useMemo(
    () => ({
      ...baseSelectionConfig,
      getRowAriaLabel: (row: Folder) =>
        t("folders.selectFolder", {
          defaultValue: 'Select folder "{{name}}"',
          name: row.name || String(row.id),
        }),
    }),
    [baseSelectionConfig, t]
  );

  const { departments, fetchDepartments } = useDepartmentsStore();
  const { companies, fetchCompanies } = useCompaniesStore();

  const departmentOptions: SelectOption<number>[] = useMemo(
    () => departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
    [departments]
  );

  const folderTypeOptions: SelectOption<string>[] = useMemo(
    () =>
      FOLDER_TYPE_VALUES.map((value) => ({
        value,
        label: t(`folders.folderTypeOptions.${value}`, { defaultValue: value }),
      })),
    [t]
  );

  const companyOptions: SelectOption<number>[] = useMemo(
    () => companies.map((c) => ({ value: c.id, label: c.name })),
    [companies]
  );

  const handleOpenFilter = useCallback(() => {
    baseHandleOpenFilter();
    setDraftFilters({ ...appliedFilters, date_mode: deriveDateMode(appliedFilters) });
  }, [baseHandleOpenFilter, setDraftFilters, appliedFilters]);

  const handleApplyFilter = baseHandleApplyFilter;
  const handleClearFilter = baseHandleClearFilter;

  const handleDateRangeModeChange = useCallback(
    (mode: DateRangeMode) => {
      setDraftFilters((prev) => ({ ...prev, date_mode: mode }));
    },
    [setDraftFilters]
  );

  const handleDateRangeChange = useCallback(
    (args: { fromDate: Date | null; toDate: Date | null }) => {
      setDraftFilters((prev) => ({
        ...prev,
        from_date: args.fromDate != null ? toDateOnlyString(args.fromDate) : undefined,
        to_date: args.toDate != null ? toDateOnlyString(args.toDate) : undefined,
      }));
    },
    [setDraftFilters]
  );

  /** Cancel: clear all filters only if a date filter was previously applied. */
  const handleCancelFilter = useCallback(() => {
    const hadDate = !!(appliedFilters.from_date || appliedFilters.to_date);
    if (!hadDate) return;
    baseHandleClearFilter();
  }, [appliedFilters.from_date, appliedFilters.to_date, baseHandleClearFilter]);

  // ─── Data loading: departments and companies (from centralized stores) ──────
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);
  useEffect(() => {
    fetchCompanies({ limit: 100 });
  }, [fetchCompanies]);

  // ─── Navigation & search ──────────────────────────────────────────────────
  const handleNavigateToFolder = useCallback(
    (folderId: number) => {
      const folder = folders.find((f) => f.id === folderId);
      
      if (folder) {
        const folderInfo = {
          id: folder.id,
          name: folder.name,
          code: folder.code,
          company_id: folder.company_id ?? undefined,
          company_name: folder.company_name ?? undefined,
          department_id: folder.department_id,
        };
        
        // Save to localStorage for persistence across reloads
        saveFolderToCache(folderInfo);
        
        const state = { prefetchedFolder: folderInfo };
        
        if (import.meta.env.DEV) {
          console.log("[useFoldersPageContainer] Navigating to folder with state and saving to cache");
        }
        
        navigate(`${all_routes.folderDetail.replace(":id", String(folderId))}`, { state });
      } else {
        navigate(`${all_routes.folderDetail.replace(":id", String(folderId))}`);
      }
    },
    [navigate, folders]
  );

  const handleSearchDebounced = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleRefresh = refetch;

  /** Dates are already in Arabia Standard Time from the API. */
  const formatDate = useCallback((dateStr?: string | null) => (dateStr?.trim() ? dateStr : "–"), []);

  const handleGridKeyDown = useCallback(
    (folderId: number, e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleNavigateToFolder(folderId);
      }
    },
    [handleNavigateToFolder]
  );

  const handlePrimaryFilterChange = useCallback((value: number | string | null) => {
    setDraftFilters((prev) => ({
      ...prev,
      department_id: value != null && typeof value === "number" ? value : undefined,
    }));
  }, [setDraftFilters]);

  const handleSecondaryFilterChange = useCallback((value: number | string | null) => {
    setDraftFilters((prev) => ({
      ...prev,
      folder_type: value != null && typeof value === "string" ? value : undefined,
    }));
  }, [setDraftFilters]);

  const handleTertiaryFilterChange = useCallback((value: number | string | null) => {
    setDraftFilters((prev) => ({
      ...prev,
      company_id: value != null && typeof value === "number" ? value : undefined,
    }));
  }, [setDraftFilters]);

  /** Single-folder delete: call from useConfirmDialog onConfirm. Throws on failure so modal stays open. */
  const confirmDeleteFolder = useCallback(
    async (id: number) => {
      try {
        const result = await deleteFolder(id);
        if (!result?.ok) {
          toast.error(t("folders.deleteFailed"));
          throw new Error("Delete failed");
        }
        toast.success(t("folders.folderDeleted"));
        void invalidateFolderData();
      } catch (e: unknown) {
        toast.error(getErrorMessage(e, t("folders.deleteFailed")));
        throw e;
      }
    },
    [t]
  );

  // ─── Edit panel handlers ───────────────────────────────────────────────────
  const handleOpenEditFolder = useCallback((folder: Folder) => {
    setEditingFolder(folder);
  }, []);

  const handleCloseEditFolder = useCallback(() => {
    setEditingFolder(null);
  }, []);

  const handleEditFolderSuccess = useCallback(() => {
    void invalidateFolderData();
    setEditingFolder(null);
  }, []);

  // ─── Create panel handlers ─────────────────────────────────────────────────
  const handleOpenCreateFolder = useCallback(() => {
    setIsCreateFolderOpen(true);
  }, []);

  const handleCloseCreateFolder = useCallback(() => {
    setIsCreateFolderOpen(false);
  }, []);

  const handleCreateFolderSuccess = useCallback(() => {
    void invalidateFolderData();
    setIsCreateFolderOpen(false);
  }, []);

  /** Batch delete: calls API to delete multiple folders; resets selection and refetches on success. */
  const confirmBatchDeleteFolders = useCallback(
    async (force = false) => {
      if (selectedFolderIds.length === 0) return;
      
      setIsBatchDeleting(true);
      try {
        const result = await batchDeleteFolders(selectedFolderIds, force);
        
        // Handle partial success (some skipped or errored)
        const hasSkipped = result.skipped.length > 0;
        const hasErrors = result.errors.length > 0;
        
        if (hasSkipped && !force) {
          // Some folders contain documents - ask user if they want to force delete
          const skippedNames = result.skipped.map(f => f.name).join(", ");
          const confirmForce = window.confirm(
            t("folders.batchDeleteHasDocuments", {
              defaultValue: "{{count}} folder(s) contain documents and were skipped: {{names}}. Delete them anyway?",
              count: result.skipped.length,
              names: skippedNames,
            })
          );
          
          if (confirmForce) {
            // User confirmed - retry with force=true for skipped folders only
            const skippedIds = result.skipped.map(f => f.id);
            await confirmBatchDeleteFolders(true);
            return;
          }
        }
        
        if (hasErrors) {
          toast.error(
            t("folders.batchDeleteWithErrors", {
              defaultValue: "{{deleted}} deleted, {{errors}} failed",
              deleted: result.deleted_count,
              errors: result.errors.length,
            })
          );
        } else if (hasSkipped) {
          toast.warning(
            t("folders.batchDeletePartialSkipped", {
              defaultValue: "{{deleted}} deleted, {{skipped}} skipped (contain documents)",
              deleted: result.deleted_count,
              skipped: result.skipped.length,
            })
          );
        } else {
          toast.success(
            t("folders.batchDeleteSuccess", {
              defaultValue: "{{count}} folders deleted successfully",
              count: result.deleted_count,
            })
          );
        }
        
        clearSelection();
        void invalidateFolderData();
      } catch (e: unknown) {
        toast.error(getErrorMessage(e, t("folders.batchDeleteFailed", { defaultValue: "Failed to delete folders" })));
        throw e;
      } finally {
        setIsBatchDeleting(false);
      }
    },
    [selectedFolderIds, t, clearSelection]
  );

  // ─── Derived labels ───────────────────────────────────────────────────────
  const foldersCountLabel = useMemo(() => {
    if (loading) return t("common.loading", { defaultValue: "Loading..." });
    const count = filteredFolders.length;
    const total = paging.total;
    const singular = t("folders.folder", { defaultValue: "folder" });
    const plural = t("folders.folders", { defaultValue: "folders" });
    const suffix = count === 1 ? singular : plural;
    if (total > count) return `${count} / ${total} ${suffix}`;
    return `${count} ${suffix}`;
  }, [filteredFolders.length, loading, paging.total, t]);

  /** Grouped return shape: data, loading, error, filter, paging, actions, modals (KISS/DRY). */
  return {
    data: {
      routes: all_routes,
      folders,
      filteredFolders,
      foldersCountLabel,
      formatDate,
      viewMode,
      setViewMode,
    },
    loading,
    error,
    paging,
    /** Rows are being narrowed client-side, so scrolling must not auto-load the whole dataset. */
    isClientFiltered: searchQuery.trim().length > 0,
    filter: {
      isFilterOpen,
      draftFilters,
      departmentOptions,
      folderTypeOptions,
      companyOptions,
      filterApplyDisabled,
      handleOpenFilter,
      handleCloseFilter,
      handlePrimaryFilterChange,
      handleSecondaryFilterChange,
      handleTertiaryFilterChange,
      handleDateRangeModeChange,
      handleDateRangeChange,
      handleApplyFilter,
      handleClearFilter,
      handleCancelFilter,
      dateRangeFromDate: parseDateOnly(draftFilters.from_date),
      dateRangeToDate: parseDateOnly(draftFilters.to_date),
      dateRangeMode: draftFilters.date_mode ?? deriveDateMode(draftFilters),
      hasAppliedDateFilter: !!(appliedFilters.from_date || appliedFilters.to_date),
    },
    selection: {
      selectedFolderIds,
      isSomeSelected,
      selectionConfig,
      clearSelection,
      isBatchDeleting,
    },
    actions: {
      handleSearchDebounced,
      handleNavigateToFolder,
      handleRefresh,
      handleGridKeyDown,
      getFolderStatusBadgeVariant,
      confirmDeleteFolder,
      confirmBatchDeleteFolders,
      handleOpenEditFolder,
      handleCloseEditFolder,
      handleEditFolderSuccess,
      handleOpenCreateFolder,
      handleCloseCreateFolder,
      handleCreateFolderSuccess,
    },
    modals: {
      editingFolder,
      isCreateFolderOpen,
    },
  };
}
