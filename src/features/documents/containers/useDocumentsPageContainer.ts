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
import { downloadDocumentWithToast } from "../../../shared/utils/documents/downloadDocumentWithToast";
import { useDocumentListWithFilters } from "../hooks/useDocumentListWithFilters";

export interface DocumentsFilterState {
  department_id?: number;
  document_type_id?: number;
}

/**
 * Container for the main Documents page. Composes useDocumentListWithFilters
 * and adds page-specific behavior: upload panel, archive/trash/move actions.
 */
export const useDocumentsPageContainer = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const navigate = useNavigate();
  const { fetchDocuments } = useDocumentStore();
  const {
    isArchiving,
    isTrashing,
    archiveDocument,
    trashDocument,
  } = useDocumentOperations();

  const list = useDocumentListWithFilters({ paginated: false });
  const {
    documents,
    isLoading,
    error,
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

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveDocumentIds, setMoveDocumentIds] = useState<number[]>([]);
  const [moveDepartmentId, setMoveDepartmentId] = useState(0);
  const [isMoveSubmitting, setIsMoveSubmitting] = useState(false);

  const handleNavigateToDocument = useCallback(
    (documentId: number) => {
      navigate(`${routes.documentDetail.replace(":id", documentId.toString())}`);
    },
    [navigate, routes.documentDetail]
  );

  const handleDownloadDocument = useCallback(
    async (document: Document) => {
      const fileName = document.file_name ?? document.title ?? document.name ?? "document";
      await downloadDocumentWithToast(document.id, fileName, t);
    },
    [t]
  );

  const handleOpenUpload = useCallback(() => setIsUploadOpen(true), []);
  const handleCloseUpload = useCallback(() => setIsUploadOpen(false), []);
  const handleUploadSuccess = useCallback(() => {
    fetchDocuments(getFetchParams());
    setIsUploadOpen(false);
  }, [fetchDocuments, getFetchParams]);

  /** Single-doc confirm: call from useConfirmDialog onConfirm. */
  const confirmTrash = useCallback(
    async (documentId: number) => {
      await trashDocument(documentId, {
        successMessage: t("documents.trashed", { defaultValue: "Document moved to trash." }),
        errorMessage: t("documents.trashFailed", { defaultValue: "Failed to move to trash." }),
        onSuccess: () => fetchDocuments(getFetchParams()),
      });
    },
    [trashDocument, t, fetchDocuments, getFetchParams]
  );

  const confirmArchive = useCallback(
    async (documentId: number) => {
      await archiveDocument(documentId, {
        successMessage: t("documents.archived", { defaultValue: "Document archived." }),
        errorMessage: t("documents.archiveFailed", { defaultValue: "Archive failed." }),
        onSuccess: () => fetchDocuments(getFetchParams()),
      });
    },
    [archiveDocument, t, fetchDocuments, getFetchParams]
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
      onSuccess: () => fetchDocuments(getFetchParams()),
    });
    if (didTrash) clearSelection();
  }, [clearSelection, fetchDocuments, getFetchParams, selectedDocumentIds, t, trashDocument]);

  const confirmBatchArchive = useCallback(async () => {
    if (selectedDocumentIds.length === 0) return;
    const didArchive = await archiveDocument(selectedDocumentIds, {
      successMessage: t("documents.batchArchived", {
        defaultValue: "{{count}} document(s) archived.",
        count: selectedDocumentIds.length,
      }),
      errorMessage: t("documents.batchArchiveFailed", {
        defaultValue: "Failed to archive documents.",
      }),
      onSuccess: () => fetchDocuments(getFetchParams()),
    });
    if (didArchive) clearSelection();
  }, [
    archiveDocument,
    clearSelection,
    fetchDocuments,
    getFetchParams,
    selectedDocumentIds,
    t,
  ]);

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
        await fetchDocuments(getFetchParams());
      } catch (err) {
        toast.error(handleApiError(err));
      } finally {
        setIsMoveSubmitting(false);
      }
    },
    [clearSelection, fetchDocuments, getFetchParams, moveDocumentIds, t]
  );

  /** Grouped return shape: data, loading, error, filter, selection, actions, modals (KISS/DRY). */
  return {
    data: {
      documents,
      pagination: list.pagination,
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
    actions: {
      handleNavigateToDocument,
      handleDownloadDocument,
      handleRetry,
      handleRefresh,
      getDocumentStatusBadgeVariant,
      handleOpenUpload,
      handleCloseUpload,
      handleUploadSuccess,
      confirmTrash,
      confirmArchive,
      confirmBatchTrash,
      confirmBatchArchive,
      handleOpenSingleMoveConfirm,
      handleOpenBatchMoveConfirm,
      handleCloseBatchMoveConfirm,
      handleConfirmBatchMove,
    },
    modals: {
      isUploadOpen,
      isMoveModalOpen,
      moveDocumentIdsCount: moveDocumentIds.length,
      moveDepartmentId,
      isMoveSubmitting,
      isTrashing,
      isArchiving,
    },
  };
};
