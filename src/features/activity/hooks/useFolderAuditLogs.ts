import { useCallback, useEffect, useRef, useState } from "react";
import { getAuditLogs } from "../services/auditLogs.service";
import type { AuditLogEntry } from "../types/auditLogs.types";

interface UseFolderAuditLogsOptions {
  enabled?: boolean;
  perPage?: number;
}

/**
 * Fetches folder audit logs via POST /api/audit-logs with params { folder_id, per_page }.
 * Used on the folder detail page (folders/:id) for the activity section.
 */
export const useFolderAuditLogs = (
  folderId: number | null,
  options: UseFolderAuditLogsOptions = {}
) => {
  const { enabled = true, perPage = 50 } = options;

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedFolderIdRef = useRef<number | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!enabled || !folderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAuditLogs({
        folder_id: folderId,
        per_page: perPage,
      });
      setLogs(response.data ?? []);
    } catch (e: unknown) {
      setLogs([]);
      setError((e as Error)?.message || "Failed to load folder activity.");
    } finally {
      setLoading(false);
    }
  }, [enabled, folderId, perPage]);

  useEffect(() => {
    if (!enabled || folderId == null) return;
    if (lastFetchedFolderIdRef.current === folderId) return;
    lastFetchedFolderIdRef.current = folderId;
    fetchLogs().catch(() => undefined);
  }, [enabled, fetchLogs, folderId]);

  return {
    logs,
    loading,
    error,
    refresh: fetchLogs,
  };
};
