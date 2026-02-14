import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { all_routes } from "../../../router/all_routes";
import { handleApiError } from "../../../app/adapter/api/client";
import { documentsApi } from "../../../app/adapter/api/documents.api";
import { useDocumentOperations } from "../../../shared/hooks";
import type { Document } from "../../../app/adapter/api/documents.api";
import { useDocumentStore } from "../stores/documentStore";
import { getDocumentStatusBadgeVariant } from "../utils/getDocumentStatusBadgeVariant";
import { downloadBlobAsFile } from "../../../shared/utils/files/downloadBlobAsFile";
import { useDocumentListWithFilters } from "../hooks/useDocumentListWithFilters";

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
  const routes = all_routes;
  const navigate = useNavigate();
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
    handleApplyFilter,
    handleClearFilter,
    handleRetry,
    handleRefresh,
    handlePageChange,
    draftFilters,
    departmentOptions,
    documentTypeOptions,
    filterApplyDisabled,
    isFilterOpen,
    selectedDocumentIds,
    selectionConfig,
    clearSelection,
    isSomeSelected,
  } = list;

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveDocumentIds, setMoveDocumentIds] = useState<number[]>([]);
  const [moveDepartmentId, setMoveDepartmentId] = useState(0);
  const [isMoveSubmitting, setIsMoveSubmitting] = useState(false);

  const refetch = useCallback(() => {
    fetchDocuments(getFetchParams());
  }, [fetchDocuments, getFetchParams]);

  const handleNavigateToDocument = useCallback(
    (documentId: number) => {
      navigate(`${routes.documentDetail.replace(":id", documentId.toString())}`);
    },
    [navigate, routes.documentDetail]
  );

  const handleDownloadDocument = useCallback(
    async (document: Document) => {
      try {
        const blob = await documentsApi.downloadDocument(document.id);
        const fileName = document.file_name ?? document.title ?? document.name ?? "document";
        downloadBlobAsFile(blob, fileName);
        toast.success(t("documents.downloadSuccess", { defaultValue: "Download started." }));
      } catch (err) {
        toast.error(
          handleApiError(err) ||
            t("documents.downloadFailed", { defaultValue: "Download failed." })
        );
      }
    },
    [t]
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
      documents,
      pagination,
      routes,
    },
    loading: isLoading,
    error,
    filter: {
      isFilterOpen,
      draftFilters,
      departmentOptions,
      documentTypeOptions,
      handleOpenFilter,
      handleCloseFilter,
      handlePrimaryFilterChange,
      handleSecondaryFilterChange,
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
    },
    paging: {
      pagination,
      handlePageChange,
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
