/**
 * useTrashDocumentCount - Fetches total count of trashed documents for dashboard/summary.
 * Lives in shared so Dashboard can use it without pulling the feature-documents chunk.
 * Uses getTrashDocuments with minimal page size to get pagination.total (or count).
 */

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrashDocuments } from "@/app/adapter/api/documents";
import { queryKeys } from "../lib/queryKeys";

export const useTrashDocumentCount = () => {
  const query = useQuery({
    queryKey: queryKeys.documents.trashCount(),
    queryFn: () => getTrashDocuments({ page: 1, per_page: 1 }),
  });
  const { refetch: rawRefetch } = query;
  const refetch = useCallback(() => {
    void rawRefetch();
  }, [rawRefetch]);

  // Reads `count` first (top-level field the server always returns), then falls
  // back to `pagination.total` for any paginated endpoint variant.
  const count =
    query.data?.count ??
    (query.data?.pagination as { total?: number } | undefined)?.total ??
    0;
  const loading = query.isLoading;

  return { count, loading, refetch };
};
