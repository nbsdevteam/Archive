import { useCallback, useEffect, useState } from "react";
import { documentsApi } from "@/app/adapter/api/documents.api";

/** Minimal attachment shape for list fetching; API returns full Attachment type. */
export interface AttachmentListItem {
  id: number;
  name: string;
  file_name: string;
  file_size?: number;
  description?: string | null;
  attachment_type?: string;
}

export interface UseAttachmentsListOptions {
  /** When false, no fetch runs (e.g. tab not active). Default true when documentId is set. */
  enabled?: boolean;
}

/**
 * Shared primitive: fetch attachments for a document, loading state, and refresh.
 * Use in document detail and folder detail; layer selection/edit/delete in feature hooks.
 */
export function useAttachmentsList(
  documentId: number | null,
  options: UseAttachmentsListOptions = {}
) {
  const { enabled = true } = options;
  const [attachments, setAttachments] = useState<AttachmentListItem[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const refreshAttachments = useCallback(async () => {
    if (!documentId) return;
    setLoadingAttachments(true);
    try {
      const r = await documentsApi.listAttachments(documentId);
      setAttachments((r.data ?? []) as AttachmentListItem[]);
    } catch {
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (!documentId || !enabled) return;
    setLoadingAttachments(true);
    documentsApi
      .listAttachments(documentId)
      .then((r) => setAttachments((r.data ?? []) as AttachmentListItem[]))
      .catch(() => setAttachments([]))
      .finally(() => setLoadingAttachments(false));
  }, [documentId, enabled]);

  return {
    attachments,
    loadingAttachments,
    refreshAttachments,
  };
}
