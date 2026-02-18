/**
 * Shared utilities for navigation with prefetched state to avoid duplicate API calls.
 * Use when parent already has entity data and target would refetch the same endpoint.
 */

import type { NavigateFunction } from "react-router-dom";
import type { DocumentDetail } from "@/app/adapter/api/documents.api";
import type { Attachment } from "@/app/adapter/api/documents.api";

/** Route state for document detail navigation with prefetched document. */
export interface DocumentDetailRouteState {
  prefetchedDocument?: DocumentDetail;
  prefetchedAt?: number;
  prefetchedFrom?: string;
}

/** Route state for attachment view navigation with prefetched doc title and attachment list. */
export interface AttachmentViewRouteState {
  prefetchedDocId?: number;
  prefetchedDocTitle?: string;
  prefetchedAttachments?: Attachment[];
  prefetchedAt?: number;
  prefetchedFrom?: string;
}

/**
 * Navigate to document detail with optional prefetched document.
 * If prefetched document matches the target ID, passes it in state to skip duplicate API call.
 */
export function navigateToDocumentDetail(
  navigate: NavigateFunction,
  documentDetailRoute: string,
  documentId: number,
  options?: {
    prefetchedDocument?: DocumentDetail | null;
    prefetchedFrom?: string;
  }
): void {
  const path = documentDetailRoute.replace(":id", String(documentId));
  const { prefetchedDocument, prefetchedFrom } = options ?? {};
  
  if (prefetchedDocument?.id === documentId) {
    navigate(path, {
      state: {
        prefetchedDocument,
        prefetchedAt: Date.now(),
        prefetchedFrom: prefetchedFrom ?? "unknown",
      } satisfies DocumentDetailRouteState,
    });
  } else {
    navigate(path);
  }
}

/**
 * Navigate to attachment view with optional prefetched doc title and attachments list.
 * Passes state to skip duplicate getDocument and/or listAttachments calls.
 */
export function navigateToAttachmentView(
  navigate: NavigateFunction,
  attachmentViewRoute: string,
  documentId: number,
  attachmentId: number,
  options?: {
    prefetchedDocTitle?: string | null;
    prefetchedAttachments?: Attachment[] | null;
    prefetchedFrom?: string;
  }
): void {
  const path = attachmentViewRoute
    .replace(":id", String(documentId))
    .replace(":attachmentId", String(attachmentId));
  
  const { prefetchedDocTitle, prefetchedAttachments, prefetchedFrom } = options ?? {};
  const hasState = prefetchedDocTitle != null || (prefetchedAttachments && prefetchedAttachments.length > 0);
  
  if (hasState) {
    navigate(path, {
      state: {
        prefetchedDocId: documentId,
        prefetchedDocTitle: prefetchedDocTitle ?? undefined,
        prefetchedAttachments: prefetchedAttachments ?? undefined,
        prefetchedAt: Date.now(),
        prefetchedFrom: prefetchedFrom ?? "unknown",
      } satisfies AttachmentViewRouteState,
    });
  } else {
    navigate(path);
  }
}
