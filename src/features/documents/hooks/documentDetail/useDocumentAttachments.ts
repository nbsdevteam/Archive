import { useCallback, useState } from "react";
import { useAttachmentOperations, useSelection, useAttachmentsList } from "@/shared/hooks";
import { fileToBase64 } from "@/shared/utils/files/fileToBase64";
import type { AttachmentListItem } from "@/shared/hooks";

/**
 * Lists and manages attachments for document detail; includes selection and edit-attachment state.
 * Edit uses the same sidebar as add attachment (panel open + editAttachmentId set = edit mode).
 */
export interface UseDocumentAttachmentsOptions {
  /** Called after attachment metadata is successfully updated (e.g. to close the sidebar). */
  onEditSuccess?: () => void;
}

export function useDocumentAttachments(docId: number | null, activeTab: string, options?: UseDocumentAttachmentsOptions) {
  const { onEditSuccess } = options ?? {};
  const { attachments, loadingAttachments, refreshAttachments } = useAttachmentsList(docId, {
    enabled: activeTab === "attachments",
  });

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

  /** Closes edit state (used when closing the attachment sidebar). */
  const handleCloseEditAttachment = useCallback(() => {
    if (!isUpdatingAttachment) {
      setEditAttachmentId(null);
      setEditAttachmentName("");
      setEditAttachmentDescription("");
    }
  }, [isUpdatingAttachment]);

  /** Clears edit state so the attachment sidebar shows add form. */
  const clearEditAttachmentState = useCallback(() => {
    setEditAttachmentId(null);
    setEditAttachmentName("");
    setEditAttachmentDescription("");
  }, []);

  /** Fills edit state for the given attachment (caller should open the attachment sidebar). */
  const handleOpenEditAttachment = useCallback((attachmentId: number) => {
    const target = attachments.find((a) => a.id === attachmentId);
    if (!target) return;
    setEditAttachmentId(target.id);
    setEditAttachmentName(target.name ?? "");
    setEditAttachmentDescription(target.description ?? "");
  }, [attachments]);

  /** Saves attachment (name/description and optional replace file). */
  const handleConfirmEditAttachment = useCallback(
    async (replaceFile?: File | null) => {
      if (!editAttachmentId) return;
      const name = String(editAttachmentName ?? "").trim() || undefined;
      const description = String(editAttachmentDescription ?? "").trim() || null;
      const payload: { name?: string; description?: string | null; file_data?: string; file_name?: string } = {
        name,
        description,
      };
      if (replaceFile instanceof File) {
        payload.file_data = await fileToBase64(replaceFile);
        payload.file_name = replaceFile.name;
      }
      const didUpdate = await updateAttachment(editAttachmentId, payload);
      if (didUpdate) {
        handleCloseEditAttachment();
        onEditSuccess?.();
      }
    },
    [editAttachmentId, editAttachmentName, editAttachmentDescription, updateAttachment, handleCloseEditAttachment, onEditSuccess]
  );

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
    editAttachmentId,
    editAttachmentName,
    editAttachmentDescription,
    setEditAttachmentName,
    setEditAttachmentDescription,
    handleOpenEditAttachment,
    handleCloseEditAttachment,
    handleConfirmEditAttachment,
    clearEditAttachmentState,
  };
}
