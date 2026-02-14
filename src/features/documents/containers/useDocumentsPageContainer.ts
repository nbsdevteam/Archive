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
  const [trashTargetId, setTrashTargetId] = useState<number | null>(null);
  const [archiveTargetId, setArchiveTargetId] = useState<number | null>(null);
  const [isBatchTrashConfirmOpen, setIsBatchTrashConfirmOpen] = useState(false);
  const [isBatchArchiveConfirmOpen, setIsBatchArchiveConfirmOpen] = useState(false);
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

  const handleOpenUpload = useCallback(() => setIsUploadOpen(true), []);
  const handleCloseUpload = useCallback(() => setIsUploadOpen(false), []);
  const handleUploadSuccess = useCallback(() => {
    fetchDocuments(getFetchParams());
    setIsUploadOpen(false);
  }, [fetchDocuments, getFetchParams]);

  const handleOpenTrashConfirm = useCallback((documentId: number) => {
    setTrashTargetId(documentId);
  }, []);
  const handleCloseTrashConfirm = useCallback(() => {
    if (!isTrashing) setTrashTargetId(null);
  }, [isTrashing]);
  const handleConfirmTrash = useCallback(async () => {
    if (!trashTargetId) return;
    const didTrash = await trashDocument(trashTargetId, {
      successMessage: t("documents.trashed", { defaultValue: "Document moved to trash." }),
      errorMessage: t("documents.trashFailed", { defaultValue: "Failed to move to trash." }),
      onSuccess: () => fetchDocuments(getFetchParams()),
    });
    if (didTrash) setTrashTargetId(null);
  }, [trashDocument, trashTargetId, t, fetchDocuments, getFetchParams]);

  const handleOpenArchiveConfirm = useCallback((documentId: number) => {
    setArchiveTargetId(documentId);
  }, []);
  const handleCloseArchiveConfirm = useCallback(() => {
    if (!isArchiving) setArchiveTargetId(null);
  }, [isArchiving]);
  const handleConfirmArchive = useCallback(async () => {
    if (!archiveTargetId) return;
    const didArchive = await archiveDocument(archiveTargetId, {
      successMessage: t("documents.archived", { defaultValue: "Document archived." }),
      errorMessage: t("documents.archiveFailed", { defaultValue: "Archive failed." }),
      onSuccess: () => fetchDocuments(getFetchParams()),
    });
    if (didArchive) setArchiveTargetId(null);
  }, [archiveDocument, archiveTargetId, fetchDocuments, getFetchParams, t]);

  const handleOpenBatchTrashConfirm = useCallback(() => {
    if (selectedDocumentIds.length > 0) setIsBatchTrashConfirmOpen(true);
  }, [selectedDocumentIds.length]);
  const handleCloseBatchTrashConfirm = useCallback(() => {
    if (!isTrashing) setIsBatchTrashConfirmOpen(false);
  }, [isTrashing]);
  const handleConfirmBatchTrash = useCallback(async () => {
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
    if (didTrash) {
      clearSelection();
      setIsBatchTrashConfirmOpen(false);
    }
  }, [clearSelection, fetchDocuments, getFetchParams, selectedDocumentIds, t, trashDocument]);

  const handleOpenBatchArchiveConfirm = useCallback(() => {
    if (selectedDocumentIds.length > 0) setIsBatchArchiveConfirmOpen(true);
  }, [selectedDocumentIds.length]);
  const handleCloseBatchArchiveConfirm = useCallback(() => {
    if (!isArchiving) setIsBatchArchiveConfirmOpen(false);
  }, [isArchiving]);
  const handleConfirmBatchArchive = useCallback(async () => {
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
    if (didArchive) {
      clearSelection();
      setIsBatchArchiveConfirmOpen(false);
    }
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

  return {
    routes,
    documents,
    isLoading,
    error,
    pagination: list.pagination,
    isUploadOpen,
    handleSearchDebounced,
    handleNavigateToDocument,
    handleDownloadDocument,
    handleOpenUpload,
    handleCloseUpload,
    handleUploadSuccess,
    handleRetry,
    handleRefresh,
    getDocumentStatusBadgeVariant,
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
    trashTargetId,
    isTrashing,
    handleOpenTrashConfirm,
    handleCloseTrashConfirm,
    handleConfirmTrash,
    archiveTargetId,
    isArchiving,
    handleOpenArchiveConfirm,
    handleCloseArchiveConfirm,
    handleConfirmArchive,
    isBatchArchiveConfirmOpen,
    isBatchArchiving: isArchiving,
    handleOpenBatchArchiveConfirm,
    handleCloseBatchArchiveConfirm,
    handleConfirmBatchArchive,
    selectedDocumentIds,
    selectionConfig,
    clearSelection,
    isSomeSelected,
    isMoveModalOpen,
    moveDocumentIdsCount: moveDocumentIds.length,
    moveDepartmentId,
    isMoveSubmitting,
    handleOpenSingleMoveConfirm,
    handleOpenBatchMoveConfirm,
    handleCloseBatchMoveConfirm,
    handleConfirmBatchMove,
    isBatchTrashConfirmOpen,
    isBatchTrashing: isTrashing,
    handleOpenBatchTrashConfirm,
    handleCloseBatchTrashConfirm,
    handleConfirmBatchTrash,
  };
};
