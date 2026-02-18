import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { all_routes } from "@/router/all_routes";
import { useDepartmentsStore } from "@/shared/stores/departmentsStore";
import { useCompaniesStore } from "@/shared/stores/companiesStore";
import { useDraftAppliedFilters, usePaginationFromUrl, useClientPagination } from "@/shared/hooks";
import { handleApiError } from "@/app/adapter/api/client";
import type { SelectOption } from "@/shared/components/ui";
import { FOLDER_TYPE_VALUES } from "@/shared/constants/folderTypeOptions";
import { deleteFolder } from "@/features/folders/services/folders.api";
import { useFolders } from "@/features/folders/hooks/useFolders";
import type { Folder } from "@/features/folders/types/folders.types";
import { filterFoldersBySearch } from "@/features/folders/utils/filterFoldersBySearch";
import { getFolderStatusBadgeVariant } from "@/features/folders/utils/getFolderStatusBadgeVariant";

const VIEW_MODE = { grid: "grid", list: "list" } as const;
type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

export interface FoldersFilterState {
  department_id?: number;
  folder_type?: string;
  company_id?: number;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  const apiMessage = handleApiError(error);
  return apiMessage !== "An unexpected error occurred" ? apiMessage : fallback;
}

export function useFoldersPageContainer() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ─── View & list state ─────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODE.grid);
  const [searchQuery, setSearchQuery] = useState("");
  const { page, perPage, setPage, setPerPage, resetPage } = usePaginationFromUrl(20);

  const filterState = useDraftAppliedFilters<FoldersFilterState>();
  const { appliedFilters, draftFilters, setDraftFilters, isFilterOpen, filterApplyDisabled, handleOpenFilter, handleCloseFilter, handleApplyFilter: baseHandleApplyFilter, handleClearFilter: baseHandleClearFilter } = filterState;

  const listParams = useMemo(
    () => ({
      state: "active" as const,
      department_id: appliedFilters.department_id,
      folder_type: appliedFilters.folder_type,
      company_id: appliedFilters.company_id,
      page,
      per_page: perPage,
    }),
    [appliedFilters.department_id, appliedFilters.folder_type, appliedFilters.company_id, page, perPage]
  );

  const { folders, loading, error, pagination, fetchFolders } = useFolders({
    useApi: true,
    initialParams: listParams,
  });

  const filteredFolders = useMemo(
    () => filterFoldersBySearch(folders, searchQuery),
    [folders, searchQuery]
  );

  /** Client-side pagination: slices filteredFolders when backend doesn't paginate. */
  const { paginatedItems: paginatedFolders, pagination: resolvedPagination } =
    useClientPagination(filteredFolders, page, perPage, pagination);

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

  const handleApplyFilter = useCallback(() => {
    resetPage();
    baseHandleApplyFilter();
    fetchFolders({
      department_id: draftFilters.department_id,
      folder_type: draftFilters.folder_type,
      company_id: draftFilters.company_id,
      page: 1,
    });
  }, [resetPage, baseHandleApplyFilter, draftFilters.department_id, draftFilters.folder_type, draftFilters.company_id, fetchFolders]);

  const handleClearFilter = useCallback(() => {
    resetPage();
    baseHandleClearFilter();
    fetchFolders({ page: 1 });
  }, [resetPage, baseHandleClearFilter, fetchFolders]);

  // ─── Edit panel state ──────────────────────────────────────────────────────
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

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
      navigate(`${all_routes.folderDetail.replace(":id", String(folderId))}`);
    },
    [navigate]
  );

  /** Resets to page 1 on search so the user sees results from the start. */
  const handleSearchDebounced = useCallback((value: string) => {
    setSearchQuery(value);
    resetPage();
  }, [resetPage]);

  const handleRefresh = useCallback(() => {
    fetchFolders();
  }, [fetchFolders]);

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
        fetchFolders();
      } catch (e: unknown) {
        toast.error(getErrorMessage(e, t("folders.deleteFailed")));
        throw e;
      }
    },
    [t, fetchFolders]
  );

  // ─── Edit panel handlers ───────────────────────────────────────────────────
  const handleOpenEditFolder = useCallback((folder: Folder) => {
    setEditingFolder(folder);
  }, []);

  const handleCloseEditFolder = useCallback(() => {
    setEditingFolder(null);
  }, []);

  const handleEditFolderSuccess = useCallback(() => {
    fetchFolders();
    setEditingFolder(null);
  }, [fetchFolders]);

  // ─── Pagination handlers ────────────────────────────────────────────────────
  const handlePageChange = useCallback(
    (p: number) => { setPage(p); },
    [setPage]
  );

  const handlePerPageChange = useCallback(
    (pp: number) => { setPerPage(pp); },
    [setPerPage]
  );

  // ─── Derived labels ───────────────────────────────────────────────────────
  const foldersCountLabel = useMemo(() => {
    if (loading) return t("common.loading", { defaultValue: "Loading..." });
    const count = paginatedFolders.length;
    const total = resolvedPagination.total;
    const singular = t("folders.folder", { defaultValue: "folder" });
    const plural = t("folders.folders", { defaultValue: "folders" });
    const suffix = count === 1 ? singular : plural;
    if (total > count) return `${count} / ${total} ${suffix}`;
    return `${count} ${suffix}`;
  }, [paginatedFolders.length, loading, resolvedPagination.total, t]);

  /** Grouped return shape: data, loading, error, filter, paging, actions, modals (KISS/DRY). */
  return {
    data: {
      routes: all_routes,
      folders,
      filteredFolders: paginatedFolders,
      pagination: resolvedPagination,
      foldersCountLabel,
      formatDate,
      viewMode,
      setViewMode,
    },
    loading,
    error,
    paging: {
      pagination: resolvedPagination,
      handlePageChange,
      handlePerPageChange,
    },
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
      handleApplyFilter,
      handleClearFilter,
    },
    actions: {
      handleSearchDebounced,
      handleNavigateToFolder,
      handleRefresh,
      handleGridKeyDown,
      getFolderStatusBadgeVariant,
      confirmDeleteFolder,
      handleOpenEditFolder,
      handleCloseEditFolder,
      handleEditFolderSuccess,
    },
    modals: {
      editingFolder,
    },
  };
}
