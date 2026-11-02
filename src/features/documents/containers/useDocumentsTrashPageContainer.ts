import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { all_routes } from "@/router/all_routes";
import { documentsApi, type Document } from "@/app/adapter/api/documents.api";
import { useAuth } from "@/shared/auth";
import { useDocumentOperations } from "@/features/documents/hooks/useDocumentOperations";
import { useSelection, useDraftAppliedFilters } from "@/shared/hooks";
import { useInfiniteList } from "@/shared/hooks/useInfiniteList";
import { queryKeys } from "@/shared/lib/queryKeys";
import { getAllowedBatchActionsForDocumentsSelection } from "@/shared/services/documentBatchActionsService";
import type { DateRangeMode } from "@/shared/components/ui";

type TrashDoc = Document & { deleted_at?: string; restore_deadline?: string };

const TRASH_PAGE_SIZE = 20;
const getTrashDocId = (d: TrashDoc) => d.id;

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
  const [restoreLoadingId, setRestoreLoadingId] = useState<number | null>(null);

  const { t } = useTranslation();
  const routes = all_routes;
  const { user } = useAuth();
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

  const listParams = useMemo(
    () => ({
      ...(appliedFilters.from_date != null && appliedFilters.from_date !== "" ? { from_date: appliedFilters.from_date } : {}),
      ...(appliedFilters.to_date != null && appliedFilters.to_date !== "" ? { to_date: appliedFilters.to_date } : {}),
    }),
    [appliedFilters.from_date, appliedFilters.to_date],
  );

  const { items: documents, loading, error, refetch: fetchTrash, paging } = useInfiniteList({
    queryKey: queryKeys.documents.trash({ ...listParams, per_page: TRASH_PAGE_SIZE }),
    perPage: TRASH_PAGE_SIZE,
    fetchPage: (page, per_page) => documentsApi.listTrashDocuments({ ...listParams, page, per_page }),
    getItems: (response) => response?.data as TrashDoc[] | undefined,
    getMeta: (response) => response?.pagination,
    getItemId: getTrashDocId,
  });

  const {
    selectedIds: selectedDocumentIdsRaw,
    selectionConfig: baseSelectionConfig,
    clear: clearSelection,
  } = useSelection<TrashDoc>(documents, getTrashDocId);
  /** Selected row ids as numbers for batch APIs and batch-action visibility. */
  const selectedDocumentIds = useMemo(
    () => selectedDocumentIdsRaw.map((id) => Number(id)),
    [selectedDocumentIdsRaw]
  );
  const isSomeSelected = selectedDocumentIds.length > 0;
  /** Batch action visibility: shared service + canBatchRestore when any selected (trash page always shows restore). */
  const batchActions = useMemo(() => {
    const base = getAllowedBatchActionsForDocumentsSelection(documents, selectedDocumentIds);
    return { ...base, canBatchRestore: isSomeSelected };
  }, [documents, selectedDocumentIds, isSomeSelected]);
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

  const handleCancelFilter = useCallback(() => {
    const hadDate = !!(appliedFilters.from_date || appliedFilters.to_date);
    if (!hadDate) return;
    baseHandleClearFilter();
  }, [appliedFilters.from_date, appliedFilters.to_date, baseHandleClearFilter]);

  const handleRestore = useCallback(async (documentId: number) => {
    setRestoreLoadingId(documentId);
    await restoreDocument(documentId, {
      successMessage: t("documents.restored", { defaultValue: "Document restored." }),
      errorMessage: t("documents.restoreFailed", { defaultValue: "Failed to restore." }),
    });
    setRestoreLoadingId(null);
  }, [restoreDocument, t]);

  /** Single permanent delete: call from useConfirmDialog onConfirm. */
  const confirmPermanentDelete = useCallback(
    async (documentId: number) => {
      await permanentDeleteSingle(documentId, {
        successMessage: t("documents.permanentlyDeleted", { defaultValue: "Document permanently deleted." }),
        errorMessage: t("documents.permanentDeleteFailed", { defaultValue: "Failed to delete permanently." }),
      });
    },
    [permanentDeleteSingle, t]
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
    });
    if (didRestore) clearSelection();
  }, [clearSelection, restoreDocument, selectedDocumentIds, t]);

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
    });
    if (didDelete) clearSelection();
  }, [clearSelection, permanentDeleteBatch, selectedDocumentIds, t]);

  /** Grouped return shape: data, loading, error, selection, actions, modals, filter (KISS/DRY). */
  return {
    data: {
      routes,
      documents,
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
    },
    paging,
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
