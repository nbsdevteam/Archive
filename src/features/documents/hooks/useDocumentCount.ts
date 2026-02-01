/**
 * useDocumentCount - Lightweight hook for document count only (no search/debounce).
 * Use on Dashboard etc. to avoid useDebounce and prevent hooks order issues.
 */

import { useState, useEffect, useRef } from "react";
import * as documentsApi from "../services/documents.api";
import type { DocumentListParams, DocumentListResponse } from "../types/documents.types";

const EMPTY_PARAMS: DocumentListParams = {};

interface UseDocumentCountOptions {
  useApi?: boolean;
  initialParams?: DocumentListParams;
}

export const useDocumentCount = (options: UseDocumentCountOptions = {}) => {
  const { useApi = true, initialParams = EMPTY_PARAMS } = options;

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        if (!useApi) {
          setCount(0);
          return;
        }
        const response: DocumentListResponse = await documentsApi.listDocuments({
          ...initialParams,
          per_page: 1,
          page: 1,
        });
        if (!cancelled) {
          const total = response.pagination?.total ?? (response.documents?.length ?? 0);
          setCount(total);
        }
      } catch (err) {
        if (!cancelled) setCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [useApi, initialParams.status, initialParams.department_id, initialParams.document_type_id]);

  return { count, loading };
};
