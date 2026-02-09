/**
 * useDocuments - Hook for documents
 * Provides data fetching and state management for documents.
 * Uses app/adapter API (same HTTP client with token refresh).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { documentsApi } from "../../../app/adapter/api/documents.api";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import type { Document } from "../types/documents.types";
import type { GetDocumentsParams } from "../../../app/adapter/api/documents.api";

interface DocumentListParams {
  department_id?: number;
  document_type_id?: number;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

const EMPTY_PARAMS: DocumentListParams = {};

interface UseDocumentsOptions {
  useApi?: boolean;
  initialParams?: DocumentListParams;
}

interface PaginationShape {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export const useDocuments = (options: UseDocumentsOptions = {}) => {
  const { useApi = true, initialParams = EMPTY_PARAMS } = options;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationShape | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>(initialParams.search || "");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchDocuments = useCallback(
    async (params: DocumentListParams = {}) => {
      try {
        setLoading(true);
        setError(null);
        if (useApi) {
          try {
            const requestParams: GetDocumentsParams = { ...initialParams, ...params };
            const response = await documentsApi.getDocuments(requestParams);
            setDocuments(response.data || []);
            setPagination(response.pagination);
          } catch (err) {
            console.error("Failed to fetch documents from API:", err);
            setError(err instanceof Error ? err.message : "Failed to load documents");
            setDocuments([]);
          }
        } else {
          setDocuments([]);
          setPagination(undefined);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    },
    [useApi, initialParams]
  );

  const didRunRef = useRef(false);
  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;
    fetchDocuments({ search: debouncedSearch });
    return () => {
      setTimeout(() => {
        didRunRef.current = false;
      }, 0);
    };
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
