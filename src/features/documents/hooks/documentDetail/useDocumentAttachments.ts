import { useCallback, useEffect, useState } from "react";
import { documentsApi } from "@/app/adapter/api/documents.api";
import { useAttachmentOperations, useSelection } from "@/shared/hooks";

type AttachmentListItem = {
  id: number;
  name: string;
  file_name: string;
  file_size?: number;
  description?: string | null;
  attachment_type?: string;
};

/**
 * Lists and manages attachments for document detail; includes selection and edit-attachment modal.
 */
export function useDocumentAttachments(docId: number | null, activeTab: string) {
  const [attachments, setAttachments] = useState<AttachmentListItem[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const [isEditAttachmentModalOpen, setIsEditAttachmentModalOpen] = useState(false);
  const [editAttachmentId, setEditAttachmentId] = useState<number | null>(null);
  const [editAttachmentName, setEditAttachmentName] = useState("");
  const [editAttachmentDescription, setEditAttachmentDescription] = useState("");

  const refreshAttachments = useCallback(async () => {
    if (!docId) return;
    setLoadingAttachments(true);
    try {
      const r = await documentsApi.listAttachments(docId);
      setAttachments((r.data ?? []) as AttachmentListItem[]);
    } catch {
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  }, [docId]);

  useEffect(() => {
    if (!docId || activeTab !== "attachments") return;
    setLoadingAttachments(true);
    documentsApi
      .listAttachments(docId)
      .then((r) => setAttachments((r.data ?? []) as AttachmentListItem[]))
      .catch(() => setAttachments([]))
      .finally(() => setLoadingAttachments(false));
  }, [docId, activeTab]);

  const {
    selectedIds: attachmentSelectedIds,
    selectionConfig: attachmentSelectionConfig,
    clear: clearAttachmentSelection,
  } = useSelection<AttachmentListItem>(attachments, (a) => a.id);

  const {
    isDeletingAttachment,
    isUpdatingAttachment,
    downloadAttachment,
    deleteAttachment,
    deleteAttachments,
    updateAttachment,
  } = useAttachmentOperations(docId, { onSuccess: refreshAttachments });

  const handleCloseEditAttachment = useCallback(() => {
    if (!isUpdatingAttachment) {
      setIsEditAttachmentModalOpen(false);
      setEditAttachmentId(null);
      setEditAttachmentName("");
      setEditAttachmentDescription("");
    }
  }, [isUpdatingAttachment]);

  const handleOpenEditAttachment = useCallback((attachmentId: number) => {
    const target = attachments.find((a) => a.id === attachmentId);
    if (!target) return;
    setEditAttachmentId(target.id);
    setEditAttachmentName(target.name ?? "");
    setEditAttachmentDescription(target.description ?? "");
    setIsEditAttachmentModalOpen(true);
  }, [attachments]);

  const handleConfirmEditAttachment = useCallback(async () => {
    if (!editAttachmentId) return;
    const didUpdate = await updateAttachment(editAttachmentId, {
      name: editAttachmentName.trim() || undefined,
      description: editAttachmentDescription.trim() || null,
    });
    if (didUpdate) handleCloseEditAttachment();
  }, [editAttachmentId, editAttachmentName, editAttachmentDescription, updateAttachment, handleCloseEditAttachment]);

  return {
    attachments,
    loadingAttachments,
    refreshAttachments,
    attachmentSelectedIds,
    attachmentSelectionConfig,
    clearAttachmentSelection,
    downloadAttachment,
    deleteAttachment,
    deleteAttachments,
    updateAttachment,
    isDeletingAttachment,
    isUpdatingAttachment,
    isEditAttachmentModalOpen,
    editAttachmentId,
    editAttachmentName,
    editAttachmentDescription,
    setEditAttachmentName,
    setEditAttachmentDescription,
    handleOpenEditAttachment,
    handleCloseEditAttachment,
    handleConfirmEditAttachment,
  };
}
