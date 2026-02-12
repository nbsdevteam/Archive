/**
 * useTrashDocumentCount - Fetches total count of trashed documents for dashboard/summary.
 * Uses documentsApi.listTrashDocuments with minimal page size to get pagination.total.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { documentsApi } from "../../../app/adapter/api/documents.api";

export const useTrashDocumentCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  /** Fetches the trashed document count from the API. */
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await documentsApi.listTrashDocuments({
        page: 1,
        per_page: 1,
      });
      const total = response?.pagination?.total ?? 0;
      setCount(total);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fetches trash document count on mount, runs only once even in StrictMode. */
  useEffect(() => {
    // Prevent double fetch in StrictMode
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchCount();
  }, [fetchCount]);

  /** Imperatively re-fetches the trashed document count (e.g. after dashboard mutations). */
  const refetch = useCallback(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, refetch };
};
