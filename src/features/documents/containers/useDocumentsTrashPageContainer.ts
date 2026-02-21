import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { all_routes } from "@/router/all_routes";
import { documentsApi, type Document, type TrashDocumentsResponse } from "@/app/adapter/api/documents.api";
import { handleApiError } from "@/app/adapter/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDocumentOperations } from "@/features/documents/hooks/useDocumentOperations";
import { useSelection, usePaginationFromUrl, useClientPagination, useDraftAppliedFilters } from "@/shared/hooks";
import { getAllowedBatchActionsForDocumentsSelection } from "@/shared/services/documentBatchActionsService";
import type { DateRangeMode } from "@/shared/components/ui";

type TrashDoc = Document & { deleted_at?: string; restore_deadline?: string };

export interface TrashFilterState {
  from_date?: string;
  to_date?: string;
  date_mode?: DateRangeMode;
}

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

function deriveDateMode(f: TrashFilterState): DateRangeMode {
  if (f.from_date && f.to_date) return "between";
  if (f.from_date) return "after";
  if (f.to_date) return "upto";
  return "after";
}

/**
 * Container for the Trash page: loads trashed documents, selection, batch restore/permanent-delete, and optional date filter.
 * Returns grouped state (data, loading, selection, actions, modals, filter) for DocumentsTrashPage.
 */
export const useDocumentsTrashPageContainer = () => {
  const [documents, setDocuments] = useState<TrashDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TrashDocumentsResponse["pagination"] | undefined>(undefined);
  const [restoreLoadingId, setRestoreLoadingId] = useState<number | null>(null);

  const { t } = useTranslation();
  const routes = all_routes;
  const { user } = useAuth();
  const { page, perPage, setPage, setPerPage, resetPage } = usePaginationFromUrl(20);
  const { isRestoring, isPermanentDeleting, restoreDocument, permanentDeleteSingle, permanentDeleteBatch } =
    useDocumentOperations();
  const isAdmin = user?.role === "admin" || (user as { is_admin?: boolean })?.is_admin === true;

  const filterState = useDraftAppliedFilters<TrashFilterState>();
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

  /** Client-side pagination: slices documents when backend doesn't paginate. */
  const { paginatedItems: paginatedDocuments, pagination: resolvedPagination } =
    useClientPagination(documents, page, perPage, pagination);

  const {
    selectedIds: selectedDocumentIdsRaw,
    selectionConfig: baseSelectionConfig,
    clear: clearSelection,
  } = useSelection<TrashDoc>(paginatedDocuments, (d) => d.id);
  /** Selected row ids as numbers for batch APIs and batch-action visibility. */
  const selectedDocumentIds = useMemo(
    () => selectedDocumentIdsRaw.map((id) => Number(id)),
    [selectedDocumentIdsRaw]
  );
  const isSomeSelected = selectedDocumentIds.length > 0;
  /** Batch action visibility: shared service + canBatchRestore when any selected (trash page always shows restore). */
  const batchActions = useMemo(() => {
    const base = getAllowedBatchActionsForDocumentsSelection(paginatedDocuments, selectedDocumentIds);
    return { ...base, canBatchRestore: isSomeSelected };
  }, [paginatedDocuments, selectedDocumentIds, isSomeSelected]);
  /** Selection config with localized row aria-label for trash table. */
  const selectionConfig = useMemo(
    () => ({
      ...baseSelectionConfig,
      getRowAriaLabel: (row: TrashDoc) =>
        t("documents.selectDocument", {
          defaultValue: 'Select document "{{title}}"',
          title: row.title || row.name || row.barcode || String(row.id),
        }),
    }),
    [baseSelectionConfig, t]
  );

  const fetchTrash = useCallback(
    async (override?: TrashFilterState) => {
      setLoading(true);
      setError(null);
      const f = override ?? appliedFilters;
      const params: { page: number; per_page: number; from_date?: string; to_date?: string } = {
        page,
        per_page: perPage,
      };
      if (f.from_date != null && f.from_date !== "") params.from_date = f.from_date;
      if (f.to_date != null && f.to_date !== "") params.to_date = f.to_date;
      try {
        const response = await documentsApi.listTrashDocuments(params);
        setDocuments((response?.data ?? []) as TrashDoc[]);
        setPagination(response?.pagination as TrashDocumentsResponse["pagination"]);
      } catch (e: unknown) {
        setError(handleApiError(e));
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    },
    [page, perPage, appliedFilters.from_date, appliedFilters.to_date]
  );

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleOpenFilter = useCallback(() => {
    baseHandleOpenFilter();
    setDraftFilters({ ...appliedFilters, date_mode: deriveDateMode(appliedFilters) });
  }, [baseHandleOpenFilter, setDraftFilters, appliedFilters]);

  const handleApplyFilter = useCallback(() => {
    resetPage();
    baseHandleApplyFilter();
    fetchTrash(draftFilters);
  }, [resetPage, baseHandleApplyFilter, draftFilters, fetchTrash]);

  const handleClearFilter = useCallback(() => {
    resetPage();
    baseHandleClearFilter();
    fetchTrash({});
  }, [resetPage, baseHandleClearFilter, fetchTrash]);

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

  const handleCancelFilter = useCallback(() => {
    const hadDate = !!(appliedFilters.from_date || appliedFilters.to_date);
    if (!hadDate) return;
    baseHandleClearFilter();
    fetchTrash({});
  }, [appliedFilters.from_date, appliedFilters.to_date, baseHandleClearFilter, fetchTrash]);

  const handleRestore = useCallback(async (documentId: number) => {
    setRestoreLoadingId(documentId);
    await restoreDocument(documentId, {
      successMessage: t("documents.restored", { defaultValue: "Document restored." }),
      errorMessage: t("documents.restoreFailed", { defaultValue: "Failed to restore." }),
      onSuccess: fetchTrash,
    });
    setRestoreLoadingId(null);
  }, [fetchTrash, restoreDocument, t]);

  /** Single permanent delete: call from useConfirmDialog onConfirm. */
  const confirmPermanentDelete = useCallback(
    async (documentId: number) => {
      await permanentDeleteSingle(documentId, {
        successMessage: t("documents.permanentlyDeleted", { defaultValue: "Document permanently deleted." }),
        errorMessage: t("documents.permanentDeleteFailed", { defaultValue: "Failed to delete permanently." }),
        onSuccess: fetchTrash,
      });
    },
    [fetchTrash, permanentDeleteSingle, t]
  );

  const confirmBatchRestore = useCallback(async () => {
    if (selectedDocumentIds.length === 0) return;
    const didRestore = await restoreDocument(selectedDocumentIds, {
      successMessage: t("documents.batchRestored", {
        defaultValue: "{{count}} document(s) restored.",
        count: selectedDocumentIds.length,
      }),
      errorMessage: t("documents.batchRestoreFailed", {
        defaultValue: "Failed to restore selected documents.",
      }),
      onSuccess: fetchTrash,
    });
    if (didRestore) clearSelection();
  }, [clearSelection, fetchTrash, restoreDocument, selectedDocumentIds, t]);

  const confirmBatchPermanentDelete = useCallback(async () => {
    if (selectedDocumentIds.length === 0) return;
    const didDelete = await permanentDeleteBatch(selectedDocumentIds, {
      successMessage: t("documents.batchPermanentlyDeleted", {
        defaultValue: "{{count}} document(s) permanently deleted.",
        count: selectedDocumentIds.length,
      }),
      errorMessage: t("documents.batchPermanentDeleteFailed", {
        defaultValue: "Failed to permanently delete selected documents.",
      }),
      onSuccess: fetchTrash,
    });
    if (didDelete) clearSelection();
  }, [clearSelection, fetchTrash, permanentDeleteBatch, selectedDocumentIds, t]);

  const handlePageChange = useCallback(
    (p: number) => {
      setPage(p);
    },
    [setPage]
  );

  const handlePerPageChange = useCallback(
    (pp: number) => {
      setPerPage(pp);
    },
    [setPerPage]
  );

  /** Grouped return shape: data, loading, error, selection, actions, modals, filter (KISS/DRY). */
  return {
    data: {
      routes,
      documents: paginatedDocuments,
      pagination: resolvedPagination,
      isAdmin,
    },
    loading,
    error,
    selection: {
      selectedDocumentIds,
      isSomeSelected,
      selectionConfig,
      batchActions,
    },
    actions: {
      fetchTrash,
      handleRestore,
      confirmPermanentDelete,
      confirmBatchRestore,
      confirmBatchPermanentDelete,
      handlePageChange,
      handlePerPageChange,
    },
    modals: {
      restoreLoadingId: isRestoring ? restoreLoadingId : null,
      isRestoring,
      isPermanentDeleting,
    },
    filter: {
      isFilterOpen,
      handleOpenFilter,
      handleCloseFilter,
      handleApplyFilter,
      handleClearFilter,
      handleCancelFilter,
      handleDateRangeModeChange,
      handleDateRangeChange,
      filterApplyDisabled,
      dateRangeFromDate: parseDateOnly(draftFilters.from_date),
      dateRangeToDate: parseDateOnly(draftFilters.to_date),
      dateRangeMode: draftFilters.date_mode ?? deriveDateMode(draftFilters),
      hasAppliedDateFilter: !!(appliedFilters.from_date || appliedFilters.to_date),
    },
  };
};
