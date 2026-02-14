import { useConfirmDialog, useConfirmDialogEmpty } from "@/shared/hooks";

/** Confirm dialog handlers used by document detail page. */
export interface DocumentDetailDialogActions {
  confirmAttachmentTrash: (id: number) => void | Promise<void>;
  confirmBatchAttachmentTrash: () => void | Promise<void>;
  confirmDeleteNote: (id: number) => void | Promise<void>;
}

/**
 * Wires confirm dialogs for document detail (attachment trash, batch attachment trash, note delete).
 * Reduces page noise by grouping useConfirmDialog calls.
 */
export function useDocumentDetailDialogs(actions: DocumentDetailDialogActions) {
  const attachmentTrashDialog = useConfirmDialog<number>({ onConfirm: actions.confirmAttachmentTrash });
  const batchAttachmentTrashDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchAttachmentTrash });
  const noteDeleteDialog = useConfirmDialog<number>({ onConfirm: actions.confirmDeleteNote });

  return {
    attachmentTrashDialog,
    batchAttachmentTrashDialog,
    noteDeleteDialog,
  };
}
