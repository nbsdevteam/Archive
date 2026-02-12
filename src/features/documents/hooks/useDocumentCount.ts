/**
 * useDocumentCount - Lightweight hook for document count only (no search/debounce).
 * Use on Dashboard etc. to avoid useDebounce and prevent hooks order issues.
 * Uses app/adapter API (same HTTP client with token refresh).
 */

import { useState, useEffect } from "react";
import { documentsApi } from "../../../app/adapter/api/documents.api";

interface UseDocumentCountParams {
  status?: string;
  department_id?: number;
  document_type_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
}

interface UseDocumentCountOptions {
  initialParams?: UseDocumentCountParams;
}

const EMPTY_PARAMS: UseDocumentCountParams = {};

export const useDocumentCount = (options: UseDocumentCountOptions = {}) => {
  const { initialParams = EMPTY_PARAMS } = options;

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /** Re-fetches document count on every mount so navigation triggers a fresh API call. */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await documentsApi.getDocuments({
          status: initialParams.status ?? "active",
          per_page: initialParams.per_page ?? 1,
          page: initialParams.page ?? 1,
          department_id: initialParams.department_id,
          document_type_id: initialParams.document_type_id,
          search: initialParams.search,
        });
        const total = response.pagination?.total ?? response.data?.length ?? 0;
        setCount(total);
      } catch (err) {
        setCount(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [
    initialParams.status,
    initialParams.department_id,
    initialParams.document_type_id,
    initialParams.page,
    initialParams.per_page,
  ]);

  return { count, loading };
};
