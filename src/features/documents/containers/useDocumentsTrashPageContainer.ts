import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { all_routes } from "../../../router/all_routes";
import { documentsApi, type Document, type TrashDocumentsResponse } from "../../../app/adapter/api/documents.api";
import { handleApiError } from "../../../app/adapter/api/client";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDocumentOperations, useSelection } from "../../../shared/hooks";

type TrashDoc = Document & { deleted_at?: string; restore_deadline?: string };

export const useDocumentsTrashPageContainer = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const { user } = useAuth();
  const { isRestoring, isPermanentDeleting, restoreDocument, permanentDeleteSingle, permanentDeleteBatch } =
    useDocumentOperations();
  const isAdmin = user?.role === "admin" || (user as { is_admin?: boolean })?.is_admin === true;

  const [documents, setDocuments] = useState<TrashDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TrashDocumentsResponse["pagination"] | undefined>(undefined);

  const [restoreLoadingId, setRestoreLoadingId] = useState<number | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<number | null>(null);
  const [isBatchRestoreConfirmOpen, setIsBatchRestoreConfirmOpen] = useState(false);
  const [isBatchPermanentDeleteConfirmOpen, setIsBatchPermanentDeleteConfirmOpen] = useState(false);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentsApi.listTrashDocuments();
      setDocuments(response?.data ?? []);
      setPagination(response?.pagination);
    } catch (e: unknown) {
      setError(handleApiError(e));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const {
    selectedIds: selectedDocumentIdsRaw,
    selectionConfig: baseSelectionConfig,
    clear: clearSelection,
  } = useSelection<TrashDoc>(documents, (d) => d.id);
  const selectedDocumentIds = useMemo(
    () => selectedDocumentIdsRaw.map((id) => Number(id)),
    [selectedDocumentIdsRaw]
  );
  const isSomeSelected = selectedDocumentIds.length > 0;
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

  const handleRestore = useCallback(async (documentId: number) => {
    setRestoreLoadingId(documentId);
    await restoreDocument(documentId, {
      successMessage: t("documents.restored", { defaultValue: "Document restored." }),
      errorMessage: t("documents.restoreFailed", { defaultValue: "Failed to restore." }),
      onSuccess: fetchTrash,
    });
    setRestoreLoadingId(null);
  }, [fetchTrash, restoreDocument, t]);

  const handleOpenPermanentDelete = useCallback((documentId: number) => {
    setPermanentDeleteId(documentId);
  }, []);

  const handleClosePermanentDelete = useCallback(() => {
    if (!isPermanentDeleting) setPermanentDeleteId(null);
  }, [isPermanentDeleting]);

  const handleConfirmPermanentDelete = useCallback(async () => {
    if (!permanentDeleteId) return;
    const didDelete = await permanentDeleteSingle(permanentDeleteId, {
      successMessage: t("documents.permanentlyDeleted", { defaultValue: "Document permanently deleted." }),
      errorMessage: t("documents.permanentDeleteFailed", { defaultValue: "Failed to delete permanently." }),
      onSuccess: fetchTrash,
    });
    if (didDelete) {
      setPermanentDeleteId(null);
    }
  }, [fetchTrash, permanentDeleteId, permanentDeleteSingle, t]);

  const handleOpenBatchPermanentDelete = useCallback(() => {
    if (selectedDocumentIds.length > 0) {
      setIsBatchPermanentDeleteConfirmOpen(true);
    }
  }, [selectedDocumentIds.length]);

  const handleOpenBatchRestore = useCallback(() => {
    if (selectedDocumentIds.length > 0) {
      setIsBatchRestoreConfirmOpen(true);
    }
  }, [selectedDocumentIds.length]);

  const handleCloseBatchRestore = useCallback(() => {
    if (!isRestoring) {
      setIsBatchRestoreConfirmOpen(false);
    }
  }, [isRestoring]);

  const handleConfirmBatchRestore = useCallback(async () => {
    if (selectedDocumentIds.length === 0) return;
    const selectedCount = selectedDocumentIds.length;
    const didRestore = await restoreDocument(selectedDocumentIds, {
      successMessage: t("documents.batchRestored", {
        defaultValue: "{{count}} document(s) restored.",
        count: selectedCount,
      }),
      errorMessage: t("documents.batchRestoreFailed", {
        defaultValue: "Failed to restore selected documents.",
      }),
      onSuccess: fetchTrash,
    });
    if (didRestore) {
      clearSelection();
      setIsBatchRestoreConfirmOpen(false);
    }
  }, [clearSelection, fetchTrash, restoreDocument, selectedDocumentIds, t]);

  const handleCloseBatchPermanentDelete = useCallback(() => {
    if (!isPermanentDeleting) {
      setIsBatchPermanentDeleteConfirmOpen(false);
    }
  }, [isPermanentDeleting]);

  const handleConfirmBatchPermanentDelete = useCallback(async () => {
    if (selectedDocumentIds.length === 0) return;
    const selectedCount = selectedDocumentIds.length;
    const didDelete = await permanentDeleteBatch(selectedDocumentIds, {
      successMessage: t("documents.batchPermanentlyDeleted", {
        defaultValue: "{{count}} document(s) permanently deleted.",
        count: selectedCount,
      }),
      errorMessage: t("documents.batchPermanentDeleteFailed", {
        defaultValue: "Failed to permanently delete selected documents.",
      }),
      onSuccess: fetchTrash,
    });
    if (didDelete) {
      clearSelection();
      setIsBatchPermanentDeleteConfirmOpen(false);
    }
  }, [clearSelection, fetchTrash, permanentDeleteBatch, selectedDocumentIds, t]);

  return {
    routes,
    isAdmin,
    documents,
    loading,
    error,
    pagination,
    selectedDocumentIds,
    isSomeSelected,
    selectionConfig,
    restoreLoadingId: isRestoring ? restoreLoadingId : null,
    permanentDeleteId,
    isBatchRestoreConfirmOpen,
    isBatchPermanentDeleteConfirmOpen,
    isRestoring,
    isPermanentDeleting,
    fetchTrash,
    handleRestore,
    handleOpenPermanentDelete,
    handleClosePermanentDelete,
    handleConfirmPermanentDelete,
    handleOpenBatchRestore,
    handleCloseBatchRestore,
    handleConfirmBatchRestore,
    handleOpenBatchPermanentDelete,
    handleCloseBatchPermanentDelete,
    handleConfirmBatchPermanentDelete,
  };
};
