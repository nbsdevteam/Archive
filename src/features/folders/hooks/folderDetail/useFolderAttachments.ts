import { useCallback, useEffect, useState } from "react";
import { documentsApi } from "@/app/adapter/api/documents.api";
import type { Attachment } from "@/app/adapter/api/documents.api";

/**
 * Manages attachments for the selected document in folder detail.
 * Fetches attachments when attachmentsDocId changes.
 */
export function useFolderAttachments(
  attachmentsDocId: number | "",
  setAttachmentsDocId: (id: number | "") => void
) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const loadAttachmentsForDocument = useCallback(async (documentId: number) => {
    setLoadingAttachments(true);
    try {
      const r = await documentsApi.listAttachments(documentId);
      setAttachments(r.data ?? []);
    } catch {
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  }, []);

  useEffect(() => {
    if (attachmentsDocId === "" || typeof attachmentsDocId !== "number") return;
    loadAttachmentsForDocument(attachmentsDocId);
  }, [attachmentsDocId, loadAttachmentsForDocument]);

  const handleAttachmentsDocIdChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setAttachmentsDocId(e.target.value ? Number(e.target.value) : "");
    },
    [setAttachmentsDocId]
  );

  return {
    attachments,
    loadingAttachments,
    loadAttachmentsForDocument,
    handleAttachmentsDocIdChange,
  };
}
