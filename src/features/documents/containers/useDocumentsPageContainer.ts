import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { all_routes } from "../../../router/all_routes";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { handleApiError } from "../../../app/adapter/api/client";
import { documentsApi } from "../../../app/adapter/api/documents.api";
import { useDocumentOperations, useRunOnceOnMount, useSelection } from "../../../shared/hooks";
import type { SelectOption } from "../../../shared/components/ui";
import type { Document } from "../../../app/adapter/api/documents.api";
import { useDocumentStore } from "../stores/documentStore";
import { getDocumentStatusBadgeVariant } from "../utils/getDocumentStatusBadgeVariant";
import { downloadBlobAsFile } from "../../../shared/utils/files/downloadBlobAsFile";

export interface DocumentsFilterState {
  department_id?: number;
  document_type_id?: number;
}

export const useDocumentsPageContainer = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const navigate = useNavigate();
  const { documents, isLoading, fetchDocuments, error, clearError, pagination } =
    useDocumentStore();
  const {
    isArchivingSingle,
    isArchivingBatch,
    isTrashingSingle,
    isTrashingBatch,
    archiveSingle,
    archiveBatch,
    trashSingle,
    trashBatch,
  } = useDocumentOperations();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<DocumentsFilterState>({});
  const [draftFilters, setDraftFilters] = useState<DocumentsFilterState>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [trashTargetId, setTrashTargetId] = useState<number | null>(null);
  const [archiveTargetId, setArchiveTargetId] = useState<number | null>(null);
  const [isBatchTrashConfirmOpen, setIsBatchTrashConfirmOpen] = useState(false);
  const [isBatchArchiveConfirmOpen, setIsBatchArchiveConfirmOpen] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [documentTypes, setDocumentTypes] = useState<Array<{ id: number; name: string; code: string; department_id: number; department_name: string }>>([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveDocumentIds, setMoveDocumentIds] = useState<number[]>([]);
  const [moveDepartmentId, setMoveDepartmentId] = useState(0);
  const [isMoveSubmitting, setIsMoveSubmitting] = useState(false);
  const lastSearchRef = useRef<string>("");
  const {
    selectedIds: selectedDocumentIdsRaw,
    selectionConfig: baseSelectionConfig,
    clear: clearSelection,
  } = useSelection<Document>(documents, (d) => d.id);
  const selectedDocumentIds = useMemo(
    () => selectedDocumentIdsRaw.map((id) => Number(id)),
    [selectedDocumentIdsRaw]
  );

  useRunOnceOnMount(fetchDocuments);

  useEffect(() => {
    let cancelled = false;
    adminApi.getDepartments().then((res) => {
      if (!cancelled && res?.data) {
        setDepartments(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const departmentIdForTypes = draftFilters.department_id;

  useEffect(() => {
    if (departmentIdForTypes == null || departmentIdForTypes < 1) {
      setDocumentTypes([]);
      return;
    }
    let cancelled = false;
    adminApi.getDocumentTypes(departmentIdForTypes).then((res) => {
      if (!cancelled && res?.data) {
        setDocumentTypes(res.data);
      } else if (!cancelled) {
        setDocumentTypes([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [departmentIdForTypes]);

  const departmentOptions: SelectOption<number>[] = useMemo(
    () => departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
    [departments]
  );

  const documentTypeOptions: SelectOption<number>[] = useMemo(
    () => documentTypes.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
    [documentTypes]
  );

  const filterApplyDisabled = useMemo(
    () =>
      draftFilters.department_id === appliedFilters.department_id &&
      draftFilters.document_type_id === appliedFilters.document_type_id,
    [
      draftFilters.department_id,
      draftFilters.document_type_id,
      appliedFilters.department_id,
      appliedFilters.document_type_id,
    ]
  );

  const getFetchParams = useCallback(() => {
    const search = lastSearchRef.current;
    const params: { department_id?: number; document_type_id?: number; search?: string } = {
      ...appliedFilters,
    };
    if (search.length >= 1) {
      params.search = search;
    }
    return params;
  }, [appliedFilters]);

  const handleSearchDebounced = useCallback(
    (value: string) => {
      const hadSearch = lastSearchRef.current.length >= 1;
      lastSearchRef.current = value;
      if (value.length >= 1) {
        fetchDocuments({ ...getFetchParams(), search: value });
      } else if (hadSearch) {
        fetchDocuments(getFetchParams());
      }
    },
    [fetchDocuments, getFetchParams]
  );

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
      } catch (error) {
        toast.error(
          handleApiError(error) ||
            t("documents.downloadFailed", { defaultValue: "Download failed." })
        );
      }
    },
    [t]
  );

  const handleOpenUpload = useCallback(() => {
    setIsUploadOpen(true);
  }, []);

  const handleCloseUpload = useCallback(() => {
    setIsUploadOpen(false);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    fetchDocuments(getFetchParams());
    setIsUploadOpen(false);
  }, [fetchDocuments, getFetchParams]);

  const handleRetry = useCallback(() => {
    clearError();
    fetchDocuments(getFetchParams());
  }, [clearError, fetchDocuments, getFetchParams]);

  const handleRefresh = useCallback(() => {
    fetchDocuments(getFetchParams());
  }, [fetchDocuments, getFetchParams]);

  const handleOpenTrashConfirm = useCallback((documentId: number) => {
    setTrashTargetId(documentId);
  }, []);

  const handleCloseTrashConfirm = useCallback(() => {
    if (!isTrashingSingle) setTrashTargetId(null);
  }, [isTrashingSingle]);

  const handleOpenArchiveConfirm = useCallback((documentId: number) => {
    setArchiveTargetId(documentId);
  }, []);

  const handleCloseArchiveConfirm = useCallback(() => {
    if (!isArchivingSingle) setArchiveTargetId(null);
  }, [isArchivingSingle]);

  const handleConfirmArchive = useCallback(async () => {
    if (!archiveTargetId) return;
    const didArchive = await archiveSingle(archiveTargetId, {
      successMessage: t("documents.archived", { defaultValue: "Document archived." }),
      errorMessage: t("documents.archiveFailed", { defaultValue: "Archive failed." }),
      onSuccess: () => fetchDocuments(getFetchParams()),
    });
    if (didArchive) {
      setArchiveTargetId(null);
    }
  }, [archiveSingle, archiveTargetId, fetchDocuments, getFetchParams, t]);

  const handleConfirmTrash = useCallback(async () => {
    if (!trashTargetId) return;
    const didTrash = await trashSingle(trashTargetId, {
      successMessage: t("documents.trashed", { defaultValue: "Document moved to trash." }),
      errorMessage: t("documents.trashFailed", { defaultValue: "Failed to move to trash." }),
      onSuccess: () => fetchDocuments(getFetchParams()),
    });
    if (didTrash) {
      setTrashTargetId(null);
    }
  }, [trashSingle, trashTargetId, fetchDocuments, getFetchParams, t]);

  const handleOpenFilter = useCallback(() => {
    setDraftFilters(appliedFilters);
    setIsFilterOpen(true);
  }, [appliedFilters]);

  const handleCloseFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const handlePrimaryFilterChange = useCallback((value: number | string | null) => {
    setDraftFilters((prev) => ({
      ...prev,
      department_id: value != null && typeof value === "number" ? value : undefined,
      document_type_id: undefined,
    }));
  }, []);

  const handleSecondaryFilterChange = useCallback((value: number | string | null) => {
    setDraftFilters((prev) => ({
      ...prev,
      document_type_id: value != null && typeof value === "number" ? value : undefined,
    }));
  }, []);

  const handleApplyFilter = useCallback(() => {
    setAppliedFilters(draftFilters);
    const params = {
      ...draftFilters,
      ...(lastSearchRef.current.length >= 1 ? { search: lastSearchRef.current } : {}),
    };
    fetchDocuments(params);
    setIsFilterOpen(false);
  }, [draftFilters, fetchDocuments]);

  const handleClearFilter = useCallback(() => {
    setDraftFilters({});
    setAppliedFilters({});
    const params =
      lastSearchRef.current.length >= 1 ? { search: lastSearchRef.current } : undefined;
    fetchDocuments(params);
    setIsFilterOpen(false);
  }, [fetchDocuments]);

  const isSomeSelected = selectedDocumentIds.length > 0;
  const selectionConfig = useMemo(
    () => ({
      ...baseSelectionConfig,
      getRowAriaLabel: (row: Document) =>
        t("documents.selectDocument", {
          defaultValue: 'Select document "{{title}}"',
          title: row.title || row.name || row.barcode || String(row.id),
        }),
    }),
    [baseSelectionConfig, t]
  );

  const handleOpenBatchTrashConfirm = useCallback(() => {
    if (selectedDocumentIds.length > 0) setIsBatchTrashConfirmOpen(true);
  }, [selectedDocumentIds.length]);

  const handleCloseBatchTrashConfirm = useCallback(() => {
    if (!isTrashingBatch) setIsBatchTrashConfirmOpen(false);
  }, [isTrashingBatch]);

  const handleOpenBatchArchiveConfirm = useCallback(() => {
    if (selectedDocumentIds.length > 0) setIsBatchArchiveConfirmOpen(true);
  }, [selectedDocumentIds.length]);

  const handleCloseBatchArchiveConfirm = useCallback(() => {
    if (!isArchivingBatch) setIsBatchArchiveConfirmOpen(false);
  }, [isArchivingBatch]);

  const handleConfirmBatchArchive = useCallback(async () => {
    if (selectedDocumentIds.length === 0) return;
    const selectedCount = selectedDocumentIds.length;
    const didArchive = await archiveBatch(selectedDocumentIds, {
      successMessage: t("documents.batchArchived", {
        defaultValue: "{{count}} document(s) archived.",
        count: selectedCount,
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
    archiveBatch,
    clearSelection,
    fetchDocuments,
    getFetchParams,
    selectedDocumentIds,
    t,
  ]);

  const handleConfirmBatchTrash = useCallback(async () => {
    if (selectedDocumentIds.length === 0) return;
    const selectedCount = selectedDocumentIds.length;
    const didTrash = await trashBatch(selectedDocumentIds, {
      successMessage: t("documents.batchTrashed", {
        defaultValue: "{{count}} document(s) moved to trash.",
        count: selectedCount,
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
  }, [
    clearSelection,
    fetchDocuments,
    getFetchParams,
    selectedDocumentIds,
    t,
    trashBatch,
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
    (documentId: number) => {
      openMoveModalForIds([documentId]);
    },
    [openMoveModalForIds]
  );

  const handleOpenBatchMoveConfirm = useCallback(() => {
    if (selectedDocumentIds.length === 0) return;
    openMoveModalForIds(selectedDocumentIds);
  }, [openMoveModalForIds, selectedDocumentIds]);

  const moveDocumentIdsCount = moveDocumentIds.length;

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
          t("folders.transferSuccess", {
            defaultValue: "Transferred successfully.",
          })
        );
        clearSelection();
        setIsMoveModalOpen(false);
        setMoveDocumentIds([]);
        setMoveDepartmentId(0);
        fetchDocuments(getFetchParams());
      } catch (error) {
        toast.error(handleApiError(error));
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
    pagination,
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
    isTrashing: isTrashingSingle,
    handleOpenTrashConfirm,
    handleCloseTrashConfirm,
    handleConfirmTrash,
    archiveTargetId,
    isArchiving: isArchivingSingle,
    handleOpenArchiveConfirm,
    handleCloseArchiveConfirm,
    handleConfirmArchive,
    isBatchArchiveConfirmOpen,
    isBatchArchiving: isArchivingBatch,
    handleOpenBatchArchiveConfirm,
    handleCloseBatchArchiveConfirm,
    handleConfirmBatchArchive,
    selectedDocumentIds,
    selectionConfig,
    clearSelection,
    isSomeSelected,
    isMoveModalOpen,
    moveDocumentIdsCount,
    moveDepartmentId,
    isMoveSubmitting,
    handleOpenSingleMoveConfirm,
    handleOpenBatchMoveConfirm,
    handleCloseBatchMoveConfirm,
    handleConfirmBatchMove,
    isBatchTrashConfirmOpen,
    isBatchTrashing: isTrashingBatch,
    handleOpenBatchTrashConfirm,
    handleCloseBatchTrashConfirm,
    handleConfirmBatchTrash,
  };
};
