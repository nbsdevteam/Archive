import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useInfiniteList } from "@/shared/hooks/useInfiniteList";
import { queryKeys } from "@/shared/lib/queryKeys";
import { getAuditLogs } from "../services/auditLogs.service";
import type {
  AuditLogEntry,
  AuditLogsQueryParams,
  AuditLogsResult,
} from "../types/auditLogs.types";

interface UseAuditLogsOptions {
  enabled?: boolean;
  initialParams?: AuditLogsQueryParams;
}

const EMPTY_LOGS: AuditLogEntry[] = [];
const LOAD_FAILED_MESSAGE = "Failed to load activity.";

const toErrorMessage = (e: unknown) => (e as Error)?.message || LOAD_FAILED_MESSAGE;

/** A `success: false` body is a failure too, so it must reach React Query's error state. */
const fetchAuditLogs = async (params: AuditLogsQueryParams): Promise<AuditLogsResult> => {
  const response = await getAuditLogs(params);
  if (!response.success) throw new Error(response.error || LOAD_FAILED_MESSAGE);
  return response;
};

/**
 * One page of audit logs, used by the document detail activity tab. staleTime 0: the cached page
 * shows at once, but activity is recorded by actions the client cannot see, so it always revalidates.
 */
export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const { enabled = true, initialParams = {} } = options;

  const query = useQuery({
    queryKey: queryKeys.audit.list(initialParams),
    queryFn: () => fetchAuditLogs(initialParams),
    enabled,
    staleTime: 0,
  });
  const { refetch } = query;
  const refresh = useCallback(() => refetch(), [refetch]);

  return {
    logs: query.data?.data ?? EMPTY_LOGS,
    loading: query.isLoading,
    error: query.isError ? toErrorMessage(query.error) : null,
    pagination: query.data?.pagination,
    refresh,
  };
};

/** Global activity page list, loaded as the user scrolls. */
export const useInfiniteAuditLogs = (params: AuditLogsQueryParams, perPage = 50) => {
  const { items, loading, error, refetch, paging } = useInfiniteList({
    queryKey: queryKeys.audit.infinite({ ...params, per_page: perPage }),
    perPage,
    staleTime: 0,
    fetchPage: (page, per_page) => fetchAuditLogs({ ...params, page, per_page }),
    getItems: (response) => response.data,
    getMeta: (response) => response.pagination,
    getItemId: (log: AuditLogEntry) => log.id,
    getErrorMessage: toErrorMessage,
  });
  return { logs: items, loading, error, refetch, paging };
};
