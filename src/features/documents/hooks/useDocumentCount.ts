/**
 * useDocumentCount - Lightweight hook for document count only (no search/debounce).
 * Use on Dashboard etc. to avoid useDebounce and prevent hooks order issues.
 */

import { useState, useEffect, useRef } from "react";
import * as documentsApi from "../services/documents.api";
import type { DocumentListParams, DocumentListResponse } from "../types/documents.types";

const EMPTY_PARAMS: DocumentListParams = {};

interface UseDocumentCountOptions {
  initialParams?: DocumentListParams;
}

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
        const response: DocumentListResponse = await documentsApi.listDocuments({
          ...initialParams,
          per_page: 1,
          page: 1,
        });
        const total = response.pagination?.total ?? (response.documents?.length ?? 0);
        setCount(total);
      } catch (err) {
        if (!cancelled) setCount(0);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialParams.status, initialParams.department_id, initialParams.document_type_id]);

  return { count, loading };
};
