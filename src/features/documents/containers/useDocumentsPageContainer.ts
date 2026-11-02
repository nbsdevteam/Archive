import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { all_routes } from "@/router/all_routes";
import { handleApiError } from "@/app/adapter/api/client";
import { documentsApi } from "@/app/adapter/api/documents.api";
import { useDocumentOperations } from "@/features/documents/hooks/useDocumentOperations";
import { getAllowedBatchActionsForDocumentsSelection } from "@/shared/services/documentBatchActionsService";
import { useCapabilityPermissions } from "@/shared/hooks/useCapabilityPermissions";
import { gateBatchActionsForDelete } from "@/shared/utils/capabilityGating";
import type { Document } from "@/app/adapter/api/documents.api";
import { invalidateDocumentData } from "@/shared/lib/queryInvalidation";
import { getDocumentStatusBadgeVariant } from "@/features/documents/utils/getDocumentStatusBadgeVariant";
import { downloadDocumentWithToast } from "@/shared/utils/documents/downloadDocumentWithToast";
import { useAnnounce } from "@/shared/components/a11y/LiveAnnouncer";
import { useDocumentListWithFilters } from "@/features/documents/hooks/useDocumentListWithFilters";

export interface DocumentsFilterState {
  department_id?: number;
  document_type_id?: number;
}

/**
 * Container for the main Documents page. Composes useDocumentListWithFilters
 * and adds page-specific behavior: upload panel, archive/trash/move actions.
 */
export const useDocumentsPageContainer = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editDocumentId, setEditDocumentId] = useState<number | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveDocumentIds, setMoveDocumentIds] = useState<number[]>([]);
  const [moveDepartmentId, setMoveDepartmentId] = useState(0);
  /** Folder IDs to exclude from destination list (current folder(s) of documents being moved). */
  const [moveExcludeFolderIds, setMoveExcludeFolderIds] = useState<number[]>([]);
  const [isMoveSubmitting, setIsMoveSubmitting] = useState(false);
  /** When batch trash is clicked, main files in selection are blocked and listed here; user must close modal and retry with remaining selection. */
  const [mainFilesBlockModal, setMainFilesBlockModal] = useState<{ isOpen: boolean; mainFileNames: string[] }>({
    isOpen: false,
    mainFileNames: [],
  });
  const [remindersModal, setRemindersModal] = useState<{ isOpen: boolean; scope: 'selected' | 'all' }>({
    isOpen: false,
    scope: 'selected',
  });

  const { t } = useTranslation();
  const { canDeleteFiles } = useCapabilityPermissions();
  const announce = useAnnounce();
  const routes = all_routes;
  const navigate = useNavigate();
  const {
    isArchiving,
    isTrashing,
    isRestoring,
    isUnarchiving,
    archiveDocument,
    unarchiveDocument,
    trashDocument,
    restoreDocument,
  } = useDocumentOperations();

  const list = useDocumentListWithFilters();
  const {
    documents,
    isLoading,
    error,
    paging,
    handleSearchDebounced,
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
    handleRetry,
    handleRefresh,
    draftFilters,
    departmentOptions,
    documentTypeOptions,
    companyOptions,
    filterApplyDisabled,
    isFilterOpen,
    selectedDocumentIds,
    selectionConfig,
    clearSelection,
    deselectDocumentIds,
    isSomeSelected,
    dateRangeFromDate,
    dateRangeToDate,
    dateRangeMode,
    hasAppliedDateFilter,
  } = list;

  /** Batch action visibility: shared service intersection; drives toolbar batch buttons (Transfer/Archive/Trash etc.). */
  const batchActions = useMemo(
    () =>
      gateBatchActionsForDelete(
        getAllowedBatchActionsForDocumentsSelection(documents, selectedDocumentIds),
        canDeleteFiles,
      ),
    [documents, selectedDocumentIds, canDeleteFiles],
  );

  const handleOpenEdit = useCallback((documentId: number) => setEditDocumentId(documentId), []);
  const handleCloseEdit = useCallback(() => setEditDocumentId(null), []);
  const handleEditSuccess = useCallback(() => {
    void invalidateDocumentData();
    setEditDocumentId(null);
  }, []);

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

  const handleOpenUpload = useCallback(() => setIsUploadOpen(true), []);
  const handleCloseUpload = useCallback(() => setIsUploadOpen(false), []);
  const handleUploadSuccess = useCallback(() => {
    void invalidateDocumentData();
    setIsUploadOpen(false);
  }, []);

  const handleOpenSetRemindersSelected = useCallback(() => {
    if (selectedDocumentIds.length === 0) return;
    setRemindersModal({ isOpen: true, scope: 'selected' });
  }, [selectedDocumentIds.length]);

  const handleOpenSetRemindersAll = useCallback(() => {
    setRemindersModal({ isOpen: true, scope: 'all' });
  }, []);

  const handleCloseSetReminders = useCallback(() => {
    setRemindersModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleSetRemindersSuccess = useCallback(
    (updated: number) => {
      void invalidateDocumentData();
      toast.success(
        t('documents.setRemindersSuccess', {
          defaultValue: 'Reminders updated for {{count}} document(s).',
          count: updated,
        })
      );
    },
    [t]
  );

  /** Single-doc confirm: call from useConfirmDialog onConfirm. */
  const confirmTrash = useCallback(
    async (documentId: number) => {
      await trashDocument(documentId, {
        successMessage: t("documents.trashed", { defaultValue: "Document moved to trash." }),
        errorMessage: t("documents.trashFailed", { defaultValue: "Failed to move to trash." }),
      });
    },
    [trashDocument, t]
  );

  const confirmArchive = useCallback(
    async (documentId: number) => {
      await archiveDocument(documentId, {
        successMessage: t("documents.archived", { defaultValue: "Document archived." }),
        errorMessage: t("documents.archiveFailed", { defaultValue: "Archive failed." }),
      });
    },
    [archiveDocument, t]
  );

  /** Single-doc unarchive: call from useConfirmDialog onConfirm. Refetches list on success. */
  const confirmUnarchive = useCallback(
    async (documentId: number) => {
      await unarchiveDocument(documentId, {
        successMessage: t("documents.unarchived", { defaultValue: "Document unarchived." }),
        errorMessage: t("documents.unarchiveFailed", { defaultValue: "Unarchive failed." }),
      });
    },
    [unarchiveDocument, t]
  );

  /** Single-doc restore from trash: call from useConfirmDialog onConfirm. Refetches list on success. */
  const confirmRestore = useCallback(
    async (documentId: number) => {
      await restoreDocument(documentId, {
        successMessage: t("documents.restored", { defaultValue: "Document restored." }),
        errorMessage: t("documents.restoreFailed", { defaultValue: "Failed to restore." }),
      });
    },
    [restoreDocument, t]
  );

  /** Batch trash: moves all selected documents to trash; clears selection and refetches on success. */
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
    });
    if (didTrash) clearSelection();
  }, [clearSelection, selectedDocumentIds, t, trashDocument]);

  /**
   * Called when user clicks "Move Selected to Trash". If selection includes main files,
   * shows block modal, deselects main files, and does not open batch trash confirm. Otherwise opens confirm.
   */
  const handleBatchTrashClick = useCallback(
    (openBatchTrashDialog: () => void) => {
      const mainDocs = documents.filter(
        (d) => selectedDocumentIds.includes(d.id) && d.is_main_document === true
      );
      if (mainDocs.length > 0) {
        const mainFileNames = mainDocs.map(
          (d) => (d.title ?? d.name ?? d.barcode ?? String(d.id)) || String(d.id)
        );
        setMainFilesBlockModal({ isOpen: true, mainFileNames });
        deselectDocumentIds(mainDocs.map((d) => d.id));
        return;
      }
      openBatchTrashDialog();
    },
    [documents, selectedDocumentIds, deselectDocumentIds]
  );

  const handleCloseMainFilesBlockModal = useCallback(() => {
    setMainFilesBlockModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /** Batch restore: restores all selected trashed documents. */
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

  /** Batch archive: archives all selected active documents; clears selection and refetches on success. */
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
    });
    if (didArchive) clearSelection();
  }, [
    archiveDocument,
    clearSelection,
    selectedDocumentIds,
    t,
  ]);

  /** Batch unarchive: unarchives all selected archived documents. */
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
    });
    if (didUnarchive) clearSelection();
  }, [
    clearSelection,
    selectedDocumentIds,
    t,
    unarchiveDocument,
  ]);

  /** Opens transfer modal for given document IDs; excludes their current folder(s) from destination list. */
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
      const excludeIds = [
        ...new Set(
          selectedDocs
            .map((doc) => doc.folder_id)
            .filter((id): id is number => id != null && id > 0)
        ),
      ];
      setMoveDocumentIds(documentIds);
      setMoveDepartmentId(departmentIds[0]);
      setMoveExcludeFolderIds(excludeIds);
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
      setMoveExcludeFolderIds([]);
    }
  }, [isMoveSubmitting]);
  /** Batch move: calls API to move selected docs to target folder; resets modal state and refetches on success. */
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
        setMoveExcludeFolderIds([]);
        await invalidateDocumentData();
      } catch (err) {
        toast.error(handleApiError(err));
      } finally {
        setIsMoveSubmitting(false);
      }
    },
    [clearSelection, moveDocumentIds, t]
  );

  /** Grouped return shape: data, loading, error, filter, selection, paging, actions, modals (KISS/DRY). */
  return {
    data: {
      documents,
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
      handleDateRangeModeChange,
      handleDateRangeChange,
      handleApplyFilter,
      handleClearFilter,
      handleCancelFilter,
      filterApplyDisabled,
      handleSearchDebounced,
      dateRangeFromDate,
      dateRangeToDate,
      dateRangeMode,
      hasAppliedDateFilter,
    },
    selection: {
      selectedDocumentIds,
      selectionConfig,
      clearSelection,
      isSomeSelected,
      batchActions,
    },
    paging,
    actions: {
      handleNavigateToDocument,
      handleDownloadDocument,
      handleRetry,
      handleRefresh,
      getDocumentStatusBadgeVariant,
      handleOpenUpload,
      handleCloseUpload,
      handleUploadSuccess,
      handleOpenSetRemindersSelected,
      handleOpenSetRemindersAll,
      handleCloseSetReminders,
      handleSetRemindersSuccess,
      handleOpenEdit,
      handleCloseEdit,
      handleEditSuccess,
      confirmTrash,
      confirmRestore,
      confirmArchive,
      confirmUnarchive,
      confirmBatchTrash,
      confirmBatchArchive,
      confirmBatchUnarchive,
      confirmBatchRestore,
      handleOpenSingleMoveConfirm,
      handleOpenBatchMoveConfirm,
      handleCloseBatchMoveConfirm,
      handleConfirmBatchMove,
      handleBatchTrashClick,
      handleCloseMainFilesBlockModal,
    },
    modals: {
      isUploadOpen,
      editDocumentId,
      isMoveModalOpen,
      moveDocumentIdsCount: moveDocumentIds.length,
      moveDepartmentId,
      moveExcludeFolderIds,
      isMoveSubmitting,
      isTrashing,
      isArchiving,
      isRestoring,
      isUnarchiving,
      mainFilesBlockModal,
      remindersModal,
    },
  };
};
