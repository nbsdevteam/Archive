import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { all_routes } from "@/router/all_routes";
import { documentsApi, type Document, type TrashDocumentsResponse } from "@/app/adapter/api/documents.api";
import { handleApiError } from "@/app/adapter/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDocumentOperations, useSelection, usePaginationFromUrl } from "@/shared/hooks";

type TrashDoc = Document & { deleted_at?: string; restore_deadline?: string };

export const useDocumentsTrashPageContainer = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const { user } = useAuth();
  const { page, perPage, setPage, setPerPage } = usePaginationFromUrl(20);
  const { isRestoring, isPermanentDeleting, restoreDocument, permanentDeleteSingle, permanentDeleteBatch } =
    useDocumentOperations();
  const isAdmin = user?.role === "admin" || (user as { is_admin?: boolean })?.is_admin === true;

  const [documents, setDocuments] = useState<TrashDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TrashDocumentsResponse["pagination"] | undefined>(undefined);

  const [restoreLoadingId, setRestoreLoadingId] = useState<number | null>(null);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentsApi.listTrashDocuments({ page, per_page: perPage });
      setDocuments((response?.data ?? []) as TrashDoc[]);
      setPagination(response?.pagination as TrashDocumentsResponse["pagination"]);
    } catch (e: unknown) {
      setError(handleApiError(e));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

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

  /** Grouped return shape: data, loading, error, selection, actions, modals (KISS/DRY). */
  return {
    data: {
      routes,
      documents,
      pagination,
      isAdmin,
    },
    loading,
    error,
    selection: {
      selectedDocumentIds,
      isSomeSelected,
      selectionConfig,
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
  };
};
