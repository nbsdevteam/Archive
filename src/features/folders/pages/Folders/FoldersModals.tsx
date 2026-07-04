import type { TFunction } from "i18next";
import { ConfirmModal } from "@/shared/components/ui";
import { EditFolderSidePanel, CreateFolderSidePanel } from "../../components";
import type { FolderDetail } from "../../types/folders.types";

export interface FoldersModalsProps {
  t: TFunction;
  deleteFolderDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading?: boolean } };
  batchDeleteDialog?: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading?: boolean } };
  selectedFolderIds?: number[];
  isEditOpen: boolean;
  editingFolder: FolderDetail | null;
  onCloseEdit: () => void;
  onEditSuccess: () => void;
  isCreateOpen: boolean;
  onCloseCreate: () => void;
  onCreateSuccess: () => void;
}

export function FoldersModals(props: FoldersModalsProps) {
  const { t, deleteFolderDialog, batchDeleteDialog, selectedFolderIds = [], isEditOpen, editingFolder, onCloseEdit, onEditSuccess, isCreateOpen, onCloseCreate, onCreateSuccess } = props;
  return (
    <>
      <ConfirmModal
        {...deleteFolderDialog.modalProps}
        title={t("folders.deleteFolder", { defaultValue: "Delete folder" })}
        message={t("folders.confirmDeleteFolder", { defaultValue: "Are you sure you want to delete this folder? Documents may be affected." })}
        confirmLabel={t("folders.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />
      {batchDeleteDialog && (
        <ConfirmModal
          {...batchDeleteDialog.modalProps}
          title={t("folders.batchDeleteTitle", { defaultValue: "Delete folders" })}
          message={t("folders.confirmBatchDelete", {
            defaultValue: "Are you sure you want to delete {{count}} folders? This action cannot be undone and documents may be affected.",
            count: selectedFolderIds.length,
          })}
          confirmLabel={t("folders.delete", { defaultValue: "Delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          confirmVariant="danger"
        />
      )}
      <EditFolderSidePanel isOpen={isEditOpen} onClose={onCloseEdit} folder={editingFolder} onSuccess={onEditSuccess} />
      <CreateFolderSidePanel isOpen={isCreateOpen} onClose={onCloseCreate} onSuccess={onCreateSuccess} />
    </>
  );
}
