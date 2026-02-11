/**
 * useTrashDocumentCount - Fetches total count of trashed documents for dashboard/summary.
 * Uses documentsApi.listTrashDocuments with minimal page size to get pagination.total.
 */

import { useState, useEffect, useRef } from "react";
import { documentsApi } from "../../../app/adapter/api/documents.api";

export const useTrashDocumentCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
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
    })();
  }, []);

  return { count, loading };
};
