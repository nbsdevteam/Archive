import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/queryKeys";
import { getAuditLogs } from "../services/auditLogs.service";
import type { AuditLogEntry } from "../types/auditLogs.types";

interface UseFolderAuditLogsOptions {
  enabled?: boolean;
  perPage?: number;
}

const EMPTY_LOGS: AuditLogEntry[] = [];

/**
 * Fetches folder audit logs via POST /api/audit-logs with params { folder_id, per_page }.
 * Used on the folder detail page (folders/:id) for the activity section.
 */
export const useFolderAuditLogs = (
  folderId: number | null,
  options: UseFolderAuditLogsOptions = {}
) => {
  const { enabled = true, perPage = 50 } = options;
  const params = { folder_id: folderId ?? undefined, per_page: perPage };

  const query = useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: () => getAuditLogs(params),
    enabled: enabled && Boolean(folderId),
    staleTime: 0,
  });
  const { refetch } = query;
  const refresh = useCallback(() => refetch(), [refetch]);

  return {
    logs: query.data?.data ?? EMPTY_LOGS,
    loading: query.isLoading,
    error: query.isError ? (query.error as Error)?.message || "Failed to load folder activity." : null,
    refresh,
  };
};
