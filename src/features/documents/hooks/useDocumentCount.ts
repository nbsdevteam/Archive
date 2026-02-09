/**
 * useDocumentCount - Lightweight hook for document count only (no search/debounce).
 * Use on Dashboard etc. to avoid useDebounce and prevent hooks order issues.
 * Uses app/adapter API (same HTTP client with token refresh).
 */

import { useState, useEffect, useRef } from "react";
import { documentsApi } from "../../../app/adapter/api/documents.api";

interface UseDocumentCountParams {
  status?: string;
  department_id?: number;
  document_type_id?: number;
  search?: string;
}

interface UseDocumentCountOptions {
  initialParams?: UseDocumentCountParams;
}

const EMPTY_PARAMS: UseDocumentCountParams = {};

export const useDocumentCount = (options: UseDocumentCountOptions = {}) => {
  const { initialParams = EMPTY_PARAMS } = options;

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const response = await documentsApi.getDocuments({
          status:"",
          per_page: 20,
          page: 1,
        });
        const total = response.pagination?.total ?? (response.data?.length ?? 0);
        if (!cancelled) setCount(total);
      } catch (err) {
        if (!cancelled) setCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialParams.status, initialParams.department_id, initialParams.document_type_id]);

  return { count, loading };
};
