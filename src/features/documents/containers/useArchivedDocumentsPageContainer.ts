import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { all_routes } from "@/router/all_routes";
import { handleApiError } from "@/app/adapter/api/client";
import { documentsApi } from "@/app/adapter/api/documents.api";
import { useDocumentOperations, usePaginationFromUrl, useClientPagination } from "@/shared/hooks";
import { getAllowedBatchActionsForDocumentsSelection } from "@/shared/services/documentBatchActionsService";
import type { Document } from "@/app/adapter/api/documents.api";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { getDocumentStatusBadgeVariant } from "@/features/documents/utils/getDocumentStatusBadgeVariant";
import { downloadDocumentWithToast } from "@/shared/utils/documents/downloadDocumentWithToast";
import { useAnnounce } from "@/shared/components/a11y/LiveAnnouncer";
import { useDocumentListWithFilters } from "@/features/documents/hooks/useDocumentListWithFilters";

export interface ArchivedDocumentsFilterState {
  department_id?: number;
  document_type_id?: number;
}

const ARCHIVED_STATUS = "archived" as const;

/**
 * Container for the Archived Documents page. Composes useDocumentListWithFilters
 * with status "archived" and pagination; uses useDepartmentsStore via the shared hook.
 * Adds unarchive/trash and move actions.
 */
export const useArchivedDocumentsPageContainer = () => {
  const { t } = useTranslation();
  const announce = useAnnounce();
  const routes = all_routes;
  const navigate = useNavigate();
  const { page, perPage, setPage, setPerPage, resetPage } = usePaginationFromUrl(20);
  const { fetchDocuments } = useDocumentStore();
  const {
    isTrashing,
    isUnarchiving,
    trashDocument,
    unarchiveDocument,
  } = useDocumentOperations();

  const list = useDocumentListWithFilters({
    status: ARCHIVED_STATUS,
    paginated: true,
    pageOverride: page,
    perPageOverride: perPage,
  });
  const {
    documents,
    isLoading,
    error,
    pagination,
    getFetchParams,
    handleSearchDebounced,
    handleOpenFilter,
    handleCloseFilter,
    handlePrimaryFilterChange,
    handleSecondaryFilterChange,
    handleApplyFilter: listHandleApplyFilter,
    handleClearFilter: listHandleClearFilter,
    handleRetry,
    handleRefresh,
    handlePageChange: listHandlePageChange,
    draftFilters,
    departmentOptions,
    documentTypeOptions,
    companyOptions,
    handleTertiaryFilterChange,
    filterApplyDisabled,
    isFilterOpen,
    selectedDocumentIds,
    selectionConfig,
    clearSelection,
    isSomeSelected,
  } = list;

  /** Client-side pagination: slices documents when backend doesn't paginate. */
  const { paginatedItems: paginatedDocuments, pagination: resolvedPagination } =
    useClientPagination(documents, page, perPage, pagination);

  /** Batch action visibility from shared service (common-only; all listed docs are archived). */
  const batchActions = useMemo(
    () => getAllowedBatchActionsForDocumentsSelection(documents, selectedDocumentIds),
    [documents, selectedDocumentIds]
  );

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveDocumentIds, setMoveDocumentIds] = useState<number[]>([]);
  const [moveDepartmentId, setMoveDepartmentId] = useState(0);
  const [isMoveSubmitting, setIsMoveSubmitting] = useState(false);

  const refetch = useCallback(() => {
    fetchDocuments(getFetchParams());
  }, [fetchDocuments, getFetchParams]);

  const handleApplyFilter = useCallback(() => {
    resetPage();
    listHandleApplyFilter();
  }, [resetPage, listHandleApplyFilter]);

  const handleClearFilter = useCallback(() => {
    resetPage();
    listHandleClearFilter();
  }, [resetPage, listHandleClearFilter]);

  const handlePageChange = useCallback(
    (p: number) => {
      setPage(p);
      listHandlePageChange(p);
    },
    [setPage, listHandlePageChange]
  );

  const handlePerPageChange = useCallback(
    (pp: number) => {
      setPerPage(pp);
      listHandlePageChange(1);
    },
    [setPerPage, listHandlePageChange]
  );

  const handleNavigateToDocument = useCallback(
    (documentId: number) => {
      navigate(`${routes.documentDetail.replace(":id", documentId.toString())}`);
    },
    [navigate, routes.documentDetail]
  );

  const handleDownloadDocument = useCallback(
    async (document: Document) => {
      const fileName = document.file_name ?? document.title ?? document.name ?? "document";
      await downloadDocumentWithToast(document.id, fileName, t, announce);
    },
    [t, announce]
  );

  const handleUnarchive = useCallback(
    async (documentId: number) => {
      await unarchiveDocument(documentId, {
        successMessage: t("documents.unarchived", { defaultValue: "Document unarchived." }),
        errorMessage: t("documents.unarchiveFailed", { defaultValue: "Unarchive failed." }),
        onSuccess: refetch,
      });
    },
    [unarchiveDocument, t, refetch]
  );

  const confirmTrash = useCallback(
    async (documentId: number) => {
      await trashDocument(documentId, {
        successMessage: t("documents.trashed", { defaultValue: "Document moved to trash." }),
        errorMessage: t("documents.trashFailed", { defaultValue: "Failed to move to trash." }),
        onSuccess: refetch,
      });
    },
    [trashDocument, t, refetch]
  );

  const confirmBatchTrash = useCallback(async () => {
    if (selectedDocumentIds.length === 0) return;
    const didTrash = await trashDocument(selectedDocumentIds, {
      successMessage: t("documents.batchTrashed", {
        defaultValue: "{{count}} document(s) moved to trash.",
        count: selectedDocumentIds.length,
      }),
      errorMessage: t("documents.batchTrashFailed", {
        defaultValue: "Failed to move documents to trash.",
      }),
      onSuccess: refetch,
    });
    if (didTrash) clearSelection();
  }, [clearSelection, refetch, selectedDocumentIds, t, trashDocument]);

  const confirmBatchUnarchive = useCallback(async () => {
    if (selectedDocumentIds.length === 0) return;
    const didUnarchive = await unarchiveDocument(selectedDocumentIds, {
      successMessage: t("documents.batchUnarchived", {
        defaultValue: "{{count}} document(s) unarchived.",
        count: selectedDocumentIds.length,
      }),
      errorMessage: t("documents.batchUnarchiveFailed", {
        defaultValue: "Failed to unarchive documents.",
      }),
      onSuccess: refetch,
    });
    if (didUnarchive) clearSelection();
  }, [clearSelection, refetch, selectedDocumentIds, t, unarchiveDocument]);

  const openMoveModalForIds = useCallback(
    (documentIds: number[]) => {
      if (documentIds.length === 0) return;
      const selectedDocs = documents.filter((doc) => documentIds.includes(doc.id));
      const departmentIds = [
        ...new Set(
          selectedDocs
            .map((doc) => doc.department_id)
            .filter((departmentId): departmentId is number => departmentId != null)
        ),
      ];
      if (departmentIds.length !== 1) {
        toast.error(
          t("folders.transferSameDepartment", {
            defaultValue: "Selected documents must be from the same department.",
          })
        );
        return;
      }
      setMoveDocumentIds(documentIds);
      setMoveDepartmentId(departmentIds[0]);
      setIsMoveModalOpen(true);
    },
    [documents, t]
  );
  const handleOpenSingleMoveConfirm = useCallback(
    (documentId: number) => openMoveModalForIds([documentId]),
    [openMoveModalForIds]
  );
  const handleOpenBatchMoveConfirm = useCallback(() => {
    if (selectedDocumentIds.length === 0) return;
    openMoveModalForIds(selectedDocumentIds);
  }, [openMoveModalForIds, selectedDocumentIds]);
  const handleCloseBatchMoveConfirm = useCallback(() => {
    if (!isMoveSubmitting) {
      setIsMoveModalOpen(false);
      setMoveDocumentIds([]);
      setMoveDepartmentId(0);
    }
  }, [isMoveSubmitting]);
  const handleConfirmBatchMove = useCallback(
    async (targetFolderId: number) => {
      if (moveDocumentIds.length === 0) return;
      setIsMoveSubmitting(true);
      try {
        await documentsApi.batchMoveDocumentsToFolder(moveDocumentIds, targetFolderId);
        toast.success(
          t("folders.transferSuccess", { defaultValue: "Transferred successfully." })
        );
        clearSelection();
        setIsMoveModalOpen(false);
        setMoveDocumentIds([]);
        setMoveDepartmentId(0);
        await refetch();
      } catch (err) {
        toast.error(handleApiError(err));
      } finally {
        setIsMoveSubmitting(false);
      }
    },
    [clearSelection, moveDocumentIds, refetch, t]
  );

  /** Grouped return shape: data, loading, error, filter, selection, paging, actions, modals (KISS/DRY). */
  return {
    data: {
      documents: paginatedDocuments,
      pagination: resolvedPagination,
      routes,
    },
    loading: isLoading,
    error,
    filter: {
      isFilterOpen,
      draftFilters,
      departmentOptions,
      documentTypeOptions,
      companyOptions,
      handleOpenFilter,
      handleCloseFilter,
      handlePrimaryFilterChange,
      handleSecondaryFilterChange,
      handleTertiaryFilterChange,
      handleApplyFilter,
      handleClearFilter,
      filterApplyDisabled,
      handleSearchDebounced,
    },
    selection: {
      selectedDocumentIds,
      selectionConfig,
      clearSelection,
      isSomeSelected,
      batchActions,
    },
    paging: {
      pagination: resolvedPagination,
      handlePageChange,
      handlePerPageChange,
    },
    actions: {
      handleNavigateToDocument,
      handleDownloadDocument,
      handleRetry,
      handleRefresh,
      getDocumentStatusBadgeVariant,
      handleUnarchive,
      confirmTrash,
      confirmBatchTrash,
      confirmBatchUnarchive,
      handleOpenSingleMoveConfirm,
      handleOpenBatchMoveConfirm,
      handleCloseBatchMoveConfirm,
      handleConfirmBatchMove,
    },
    modals: {
      isMoveModalOpen,
      moveDocumentIdsCount: moveDocumentIds.length,
      moveDepartmentId,
      isMoveSubmitting,
      isTrashing,
      isUnarchiving,
    },
  };
};
