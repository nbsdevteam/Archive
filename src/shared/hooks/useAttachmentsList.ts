import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { documentsApi } from "@/app/adapter/api/documents.api";
import { queryKeys } from "@/shared/lib/queryKeys";

/** Minimal attachment shape for list fetching; API returns full Attachment type. */
export interface AttachmentListItem {
  id: number;
  name: string;
  file_name: string;
  file_size?: number;
  description?: string | null;
  attachment_type?: string;
}

const EMPTY_ATTACHMENTS: AttachmentListItem[] = [];

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
  // staleTime 0: revisiting a document shows its attachments at once, then revalidates.
  const query = useQuery({
    queryKey: queryKeys.documents.attachments(documentId ?? 0),
    queryFn: () => documentsApi.listAttachments(documentId as number),
    enabled: Boolean(documentId) && enabled,
    staleTime: 0,
  });
  const { refetch } = query;

  const refreshAttachments = useCallback(async () => {
    if (!documentId) return;
    await refetch();
  }, [documentId, refetch]);

  const attachments = (query.data?.data as AttachmentListItem[] | undefined) ?? EMPTY_ATTACHMENTS;
  const loadingAttachments = query.isFetching && !query.data;

  return {
    attachments,
    loadingAttachments,
    refreshAttachments,
  };
}
