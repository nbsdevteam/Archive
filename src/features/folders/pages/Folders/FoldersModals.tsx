import type { TFunction } from "i18next";
import { ConfirmModal } from "../../../../shared/components/ui";
import { EditFolderSidePanel } from "../../components";
import type { FolderDetail } from "../../types/folders.types";

export interface FoldersModalsProps {
  t: TFunction;
  deleteFolderDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading?: boolean } };
  isEditOpen: boolean;
  editingFolder: FolderDetail | null;
  onCloseEdit: () => void;
  onEditSuccess: () => void;
}

export function FoldersModals(props: FoldersModalsProps) {
  const { t, deleteFolderDialog, isEditOpen, editingFolder, onCloseEdit, onEditSuccess } = props;
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
      <EditFolderSidePanel isOpen={isEditOpen} onClose={onCloseEdit} folder={editingFolder} onSuccess={onEditSuccess} />
    </>
  );
}
