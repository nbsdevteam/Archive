import { useCallback, useState } from "react";
import { useAttachmentOperations, useSelection, useAttachmentsList } from "@/shared/hooks";
import type { AttachmentListItem } from "@/shared/hooks";

/**
 * Lists and manages attachments for document detail; includes selection and edit-attachment modal.
 * Uses shared useAttachmentsList for fetch/loading; layers selection and edit modal on top.
 */
export function useDocumentAttachments(docId: number | null, activeTab: string) {
  const { attachments, loadingAttachments, refreshAttachments } = useAttachmentsList(docId, {
    enabled: activeTab === "attachments",
  });

  const [isEditAttachmentModalOpen, setIsEditAttachmentModalOpen] = useState(false);
  const [editAttachmentId, setEditAttachmentId] = useState<number | null>(null);
  const [editAttachmentName, setEditAttachmentName] = useState("");
  const [editAttachmentDescription, setEditAttachmentDescription] = useState("");

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
