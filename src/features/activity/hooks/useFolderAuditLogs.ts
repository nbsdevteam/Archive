import { useCallback, useEffect, useRef, useState } from "react";
import { getFolderDocuments } from "../../folders/services/folders.api";
import { getAuditLogs } from "../services/auditLogs.service";
import type { AuditLogEntry } from "../types/auditLogs.types";

interface UseFolderAuditLogsOptions {
  enabled?: boolean;
  perPage?: number;
  maxDocuments?: number;
  concurrency?: number;
}

/**
 * Runs async work with a bounded concurrency to avoid flooding the API.
 */
const runWithConcurrencyLimit = async <T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  let index = 0;

  const runWorker = async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      const result = await worker(items[currentIndex]);
      results.push(result);
    }
  };

  const count = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: count }, () => runWorker()));
  return results;
};

/**
 * Fetches folder activity by listing folder documents and aggregating their audit logs.
 */
export const useFolderAuditLogs = (
  folderId: number | null,
  options: UseFolderAuditLogsOptions = {}
) => {
  const {
    enabled = true,
    perPage = 50,
    maxDocuments = 20,
    concurrency = 4,
  } = options;

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentCount, setDocumentCount] = useState(0);
  const lastFetchedFolderIdRef = useRef<number | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!enabled || !folderId) return;
    setLoading(true);
    setError(null);
    try {
      const folderDocumentsResponse = await getFolderDocuments(folderId);
      const documentIds = (folderDocumentsResponse.data ?? [])
        .map((document) => document.id)
        .filter((value): value is number => Number.isFinite(value));
      setDocumentCount(documentIds.length);

      const selectedDocumentIds = documentIds.slice(0, Math.max(1, maxDocuments));
      const responses = await runWithConcurrencyLimit(selectedDocumentIds, concurrency, async (documentId) => {
        const response = await getAuditLogs({
          document_id: documentId,
          per_page: perPage,
        });
        return response.data ?? [];
      });

      const merged = responses
        .flat()
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
      setLogs(merged);
    } catch (e: unknown) {
      setLogs([]);
      setError((e as Error)?.message || "Failed to load folder activity.");
    } finally {
      setLoading(false);
    }
  }, [concurrency, enabled, folderId, maxDocuments, perPage]);

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
    documentCount,
    refresh: fetchLogs,
  };
};
