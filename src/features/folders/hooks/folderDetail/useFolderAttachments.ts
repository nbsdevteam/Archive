import { useCallback } from "react";
import type { Attachment } from "@/app/adapter/api/documents.api";
import { useAttachmentsList } from "@/shared/hooks";

/**
 * Manages attachments for the selected document in folder detail.
 * Uses shared useAttachmentsList; fetches when attachmentsDocId is a number.
 */
export function useFolderAttachments(
  attachmentsDocId: number | "",
  setAttachmentsDocId: (id: number | "") => void
) {
  const documentId = typeof attachmentsDocId === "number" ? attachmentsDocId : null;
  const { attachments, loadingAttachments, refreshAttachments } = useAttachmentsList(documentId, {
    enabled: documentId != null,
  });

  /** Refetch attachments for the current document. Argument is ignored (documentId comes from hook state). */
  const loadAttachmentsForDocument = useCallback((_documentId?: number) => {
    refreshAttachments();
  }, [refreshAttachments]);

  const handleAttachmentsDocIdChange = useCallback(
    (docId: number) => {
      setAttachmentsDocId(docId);
    },
    [setAttachmentsDocId]
  );

  return {
    attachments: attachments as Attachment[],
    loadingAttachments,
    loadAttachmentsForDocument,
    handleAttachmentsDocIdChange,
  };
}
