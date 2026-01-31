/**
 * useDocuments - Hook for documents
 * Provides data fetching and state management for documents
 */

import { useState, useEffect, useCallback } from "react";
import * as documentsApi from "../services/documents.api";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import type { Document, DocumentListParams, DocumentListResponse } from "../types/documents.types";

const EMPTY_PARAMS: DocumentListParams = {};

interface UseDocumentsOptions {
  useApi?: boolean;
  initialParams?: DocumentListParams;
}

export const useDocuments = (options: UseDocumentsOptions = {}) => {
  const { useApi = true, initialParams = EMPTY_PARAMS } = options;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<DocumentListResponse["pagination"]>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>(initialParams.search || "");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchDocuments = useCallback(
    async (params: DocumentListParams = {}) => {
      try {
        setLoading(true);
        setError(null);
        let response: DocumentListResponse;
        if (useApi) {
          try {
            response = await documentsApi.listDocuments({ ...initialParams, ...params });
          } catch (err) {
            console.error("Failed to fetch documents from API:", err);
            setError(err instanceof Error ? err.message : "Failed to load documents");
            setDocuments([]);
            return;
          }
        } else {
          // Static fallback
          response = { documents: [] };
        }
        setDocuments(response.documents || []);
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err?.message || "Failed to load documents");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    },
    [useApi, initialParams]
  );

  useEffect(() => {
    fetchDocuments({ search: debouncedSearch });
  }, [debouncedSearch, fetchDocuments]);

  return {
    documents,
    loading,
    error,
    pagination,
    searchQuery,
    setSearchQuery,
    fetchDocuments,
  };
};
