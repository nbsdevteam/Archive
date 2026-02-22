/**
 * useDocumentCount - Lightweight hook for document count only (no search/debounce).
 * Lives in shared so Dashboard can use it without pulling the feature-documents chunk.
 * Uses app/adapter API (same HTTP client with token refresh).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { documentsApi } from "../../app/adapter/api/documents.api";

export interface UseDocumentCountParams {
  status?: string;
  department_id?: number;
  document_type_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface UseDocumentCountOptions {
  initialParams?: UseDocumentCountParams;
}

const EMPTY_PARAMS: UseDocumentCountParams = {};

export const useDocumentCount = (options: UseDocumentCountOptions = {}) => {
  const { initialParams = EMPTY_PARAMS } = options;

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const paramsRef = useRef(initialParams);
  paramsRef.current = initialParams;

  /** Fetches document count from API using current params; used for dashboard/archived counts. */
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      const params = paramsRef.current;
      const response = await documentsApi.getDocuments({
        status: params.status ?? "active",
        per_page: params.per_page ?? 1,
        page: params.page ?? 1,
        department_id: params.department_id,
        document_type_id: params.document_type_id,
        search: params.search,
      });
      const total = response.pagination?.total ?? response.data?.length ?? 0;
      setCount(total);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [JSON.stringify(initialParams)]);

  const refetch = useCallback(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, refetch };
};
