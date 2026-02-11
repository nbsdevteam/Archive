import { useCallback, useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "../services/auditLogs.service";
import type { AuditLogEntry, AuditLogsQueryParams, AuditPagination } from "../types/auditLogs.types";

interface UseAuditLogsOptions {
  enabled?: boolean;
  initialParams?: AuditLogsQueryParams;
}

/**
 * Shared audit logs hook used by document, folder and global activity pages.
 */
export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const { enabled = true, initialParams = {} } = options;
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<AuditPagination | undefined>(undefined);
  const [params, setParams] = useState<AuditLogsQueryParams>(initialParams);
  const initialParamsKey = JSON.stringify(initialParams);

  useEffect(() => {
    setParams(initialParams);
  }, [initialParamsKey]);

  const fetchLogs = useCallback(
    async (overrideParams?: AuditLogsQueryParams) => {
      if (!enabled) return;
      setLoading(true);
      setError(null);
      try {
        const query = { ...params, ...overrideParams };
        const response = await getAuditLogs(query);
        if (!response.success) {
          setLogs([]);
          setPagination(response.pagination);
          setError(response.error || "Failed to load activity.");
          return;
        }
        setLogs(response.data ?? []);
        setPagination(response.pagination);
      } catch (e: unknown) {
        setLogs([]);
        setError((e as Error)?.message || "Failed to load activity.");
      } finally {
        setLoading(false);
      }
    },
    [enabled, params]
  );

  useEffect(() => {
    if (!enabled) return;
    fetchLogs().catch(() => undefined);
  }, [enabled, fetchLogs]);

  const refresh = useMemo(() => {
    return () => fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    pagination,
    params,
    setParams,
    fetchLogs,
    refresh,
  };
};
