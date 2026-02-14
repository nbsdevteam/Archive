import { useConfirmDialog, useConfirmDialogEmpty } from "@/shared/hooks";

/** Confirm dialog handlers used by folder detail page. */
export interface FolderDetailDialogActions {
  confirmDeleteFolder: () => void | Promise<void>;
  confirmSubDocTrash: (id: number) => void | Promise<void>;
  confirmBatchSubDocTrash: () => void | Promise<void>;
  confirmAttachmentTrash: (id: number) => void | Promise<void>;
  confirmBatchAttachmentTrash: () => void | Promise<void>;
  confirmDeleteNote: (id: number) => void | Promise<void>;
}

/**
 * Wires confirm dialogs for folder detail (delete folder, sub-doc trash, attachment trash, note delete).
 * Reduces page noise by grouping useConfirmDialog calls.
 */
export function useFolderDetailDialogs(actions: FolderDetailDialogActions) {
  const deleteFolderDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmDeleteFolder });
  const subDocTrashDialog = useConfirmDialog<number>({ onConfirm: actions.confirmSubDocTrash });
  const batchSubDocTrashDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchSubDocTrash });
  const attachmentTrashDialog = useConfirmDialog<number>({ onConfirm: actions.confirmAttachmentTrash });
  const batchAttachmentTrashDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchAttachmentTrash });
  const noteDeleteDialog = useConfirmDialog<number>({ onConfirm: actions.confirmDeleteNote });

  return {
    deleteFolderDialog,
    subDocTrashDialog,
    batchSubDocTrashDialog,
    attachmentTrashDialog,
    batchAttachmentTrashDialog,
    noteDeleteDialog,
  };
}
