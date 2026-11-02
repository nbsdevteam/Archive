/**
 * useDocumentCount - Lightweight hook for document count only (no search/debounce).
 * Lives in shared so Dashboard can use it without pulling the feature-documents chunk.
 * Uses app/adapter API (same HTTP client with token refresh).
 */

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { documentsApi } from "../../app/adapter/api/documents.api";
import { queryKeys } from "../lib/queryKeys";

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

  const params = {
    status: initialParams.status ?? "active",
    per_page: initialParams.per_page ?? 1,
    page: initialParams.page ?? 1,
    department_id: initialParams.department_id,
    document_type_id: initialParams.document_type_id,
    search: initialParams.search,
  };

  const query = useQuery({
    queryKey: queryKeys.documents.count(params),
    queryFn: () => documentsApi.getDocuments(params),
  });
  const { refetch: rawRefetch } = query;
  const refetch = useCallback(() => {
    void rawRefetch();
  }, [rawRefetch]);

  const count = query.data?.pagination?.total ?? query.data?.data?.length ?? 0;
  const loading = query.isLoading;

  return { count, loading, refetch };
};
