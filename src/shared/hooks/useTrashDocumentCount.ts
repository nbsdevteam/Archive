/**
 * useTrashDocumentCount - Fetches total count of trashed documents for dashboard/summary.
 * Lives in shared so Dashboard can use it without pulling the feature-documents chunk.
 * Uses getTrashDocuments with minimal page size to get pagination.total (or count).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { getTrashDocuments } from "@/app/adapter/api/documents";

export const useTrashDocumentCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  /**
   * Fetches trashed document count from API for dashboard summary.
   * Reads `count` first (top-level field the server always returns), then falls
   * back to `pagination.total` for any paginated endpoint variant.
   */
  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTrashDocuments({ page: 1, per_page: 1 });
      const total =
        response?.count ??
        (response?.pagination as { total?: number } | undefined)?.total ??
        0;
      setCount(total);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchCount();
  }, [fetchCount]);

  const refetch = useCallback(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, refetch };
};
