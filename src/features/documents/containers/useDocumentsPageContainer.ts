import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import { useRunOnceOnMount } from "../../../shared/hooks";
import { useDocumentStore } from "../stores/documentStore";
import { getDocumentStatusBadgeVariant } from "../utils/getDocumentStatusBadgeVariant";

export const useDocumentsPageContainer = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { documents, isLoading, fetchDocuments, error, clearError, pagination } =
    useDocumentStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const lastSearchRef = useRef<string>("");

  useRunOnceOnMount(fetchDocuments);

  const handleSearchDebounced = useCallback(
    (value: string) => {
      const hadSearch = lastSearchRef.current.length >= 1;
      lastSearchRef.current = value;
      if (value.length >= 1) {
        fetchDocuments({ search: value });
      } else if (hadSearch) {
        fetchDocuments();
      }
    },
    [fetchDocuments]
  );

  const handleNavigateToDocument = useCallback(
    (documentId: number) => {
      navigate(`${routes.documentDetail.replace(":id", documentId.toString())}`);
    },
    [navigate, routes.documentDetail]
  );

  const handleOpenUpload = useCallback(() => {
    setIsUploadOpen(true);
  }, []);

  const handleCloseUpload = useCallback(() => {
    setIsUploadOpen(false);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    if (lastSearchRef.current) {
      fetchDocuments({ search: lastSearchRef.current });
    } else {
      fetchDocuments();
    }
    setIsUploadOpen(false);
  }, [fetchDocuments]);

  const handleRetry = useCallback(() => {
    clearError();
    fetchDocuments();
  }, [clearError, fetchDocuments]);

  const handleRefresh = useCallback(() => {
    if (lastSearchRef.current.length >= 1) {
      fetchDocuments({ search: lastSearchRef.current });
    } else {
      fetchDocuments();
    }
  }, [fetchDocuments]);

  return {
    routes,
    documents,
    isLoading,
    error,
    pagination,
    isUploadOpen,
    handleSearchDebounced,
    handleNavigateToDocument,
    handleOpenUpload,
    handleCloseUpload,
    handleUploadSuccess,
    handleRetry,
    handleRefresh,
    getDocumentStatusBadgeVariant,
  };
};
