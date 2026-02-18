import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { all_routes } from "@/router/all_routes";
import { handleApiError } from "@/app/adapter/api/client";
import { documentsApi } from "@/app/adapter/api/documents.api";
import { useDocumentOperations, usePaginationFromUrl } from "@/shared/hooks";
import type { Document } from "@/app/adapter/api/documents.api";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
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
  const { t } = useTranslation();
  const announce = useAnnounce();
  const routes = all_routes;
  const navigate = useNavigate();
  const { page, perPage, setPage, setPerPage, resetPage } = usePaginationFromUrl(20);
  const { fetchDocuments } = useDocumentStore();
  const {
    isArchiving,
    isTrashing,
    archiveDocument,
    trashDocument,
  } = useDocumentOperations();

  const list = useDocumentListWithFilters({
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
    deselectDocumentIds,
    isSomeSelected,
  } = list;

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

  const handleOpenEdit = useCallback((documentId: number) => setEditDocumentId(documentId), []);
  const handleCloseEdit = useCallback(() => setEditDocumentId(null), []);
  const handleEditSuccess = useCallback(() => {
    fetchDocuments(getFetchParams());
    setEditDocumentId(null);
  }, [fetchDocuments, getFetchParams]);

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
        await fetchDocuments(getFetchParams());
      } catch (err) {
        toast.error(handleApiError(err));
      } finally {
        setIsMoveSubmitting(false);
      }
    },
    [clearSelection, fetchDocuments, getFetchParams, moveDocumentIds, t]
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
    },
    paging: {
      pagination,
      handlePageChange,
      handlePerPageChange,
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
      handleOpenEdit,
      handleCloseEdit,
      handleEditSuccess,
      confirmTrash,
      confirmArchive,
      confirmBatchTrash,
      confirmBatchArchive,
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
      mainFilesBlockModal,
    },
  };
};
