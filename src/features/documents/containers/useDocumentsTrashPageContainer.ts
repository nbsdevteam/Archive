import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { all_routes } from "../../../router/all_routes";
import { documentsApi, type Document, type TrashDocumentsResponse } from "../../../app/adapter/api/documents.api";
import { handleApiError } from "../../../app/adapter/api/client";
import { useAuth } from "../../auth/hooks/useAuth";

type TrashDoc = Document & { deleted_at?: string; restore_deadline?: string };

export const useDocumentsTrashPageContainer = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || (user as { is_admin?: boolean })?.is_admin === true;

  const [documents, setDocuments] = useState<TrashDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TrashDocumentsResponse["pagination"] | undefined>(undefined);

  const [restoreLoadingId, setRestoreLoadingId] = useState<number | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<number | null>(null);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

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

  const handleRestore = useCallback(async (documentId: number) => {
    setRestoreLoadingId(documentId);
    try {
      await documentsApi.restoreDocument(documentId);
      toast.success(t("documents.restored", { defaultValue: "Document restored." }));
      fetchTrash();
    } catch (e: unknown) {
      const apiMessage = handleApiError(e);
      const message = apiMessage !== "An unexpected error occurred" ? apiMessage : (e instanceof Error ? e.message : null);
      toast.error(message || t("documents.restoreFailed", { defaultValue: "Failed to restore." }));
    } finally {
      setRestoreLoadingId(null);
    }
  }, [fetchTrash, t]);

  const handleOpenPermanentDelete = useCallback((documentId: number) => {
    setPermanentDeleteId(documentId);
  }, []);

  const handleClosePermanentDelete = useCallback(() => {
    if (!isPermanentDeleting) setPermanentDeleteId(null);
  }, [isPermanentDeleting]);

  const handleConfirmPermanentDelete = useCallback(async () => {
    if (!permanentDeleteId) return;
    setIsPermanentDeleting(true);
    try {
      await documentsApi.permanentDeleteDocument(permanentDeleteId);
      toast.success(t("documents.permanentlyDeleted", { defaultValue: "Document permanently deleted." }));
      setPermanentDeleteId(null);
      fetchTrash();
    } catch (e: unknown) {
      const apiMessage = handleApiError(e);
      const message = apiMessage !== "An unexpected error occurred" ? apiMessage : (e instanceof Error ? e.message : null);
      toast.error(message || t("documents.permanentDeleteFailed", { defaultValue: "Failed to delete permanently." }));
    } finally {
      setIsPermanentDeleting(false);
    }
  }, [permanentDeleteId, fetchTrash, t]);

  return {
    routes,
    isAdmin,
    documents,
    loading,
    error,
    pagination,
    restoreLoadingId,
    permanentDeleteId,
    isPermanentDeleting,
    fetchTrash,
    handleRestore,
    handleOpenPermanentDelete,
    handleClosePermanentDelete,
    handleConfirmPermanentDelete,
  };
};
