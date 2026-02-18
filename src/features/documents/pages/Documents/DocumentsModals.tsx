import type { TFunction } from "i18next";
import { Button, ConfirmModal, Modal, ModalFooter } from "@/shared/components/ui";
import { UploadDocumentSidePanel } from "@/features/documents/components";
import { TransferToFolderModal } from "@/features/folders/components";

/** Props for document list modals: upload panel, confirm dialogs, transfer modal, main-files block modal. */
export interface DocumentsModalsProps {
  t: TFunction;
  modals: {
    isUploadOpen: boolean;
    isMoveModalOpen: boolean;
    moveDepartmentId: number;
    moveDocumentIdsCount: number;
    /** Current folder(s) of documents being moved; excluded from destination list. */
    moveExcludeFolderIds: number[];
    isMoveSubmitting: boolean;
    /** Shown when user tries to batch-trash and selection includes main files; lists names and confirms they were unchecked. */
    mainFilesBlockModal: { isOpen: boolean; mainFileNames: string[] };
  };
  actions: {
    handleCloseUpload: () => void;
    handleUploadSuccess: () => void;
    handleCloseBatchMoveConfirm: () => void;
    handleConfirmBatchMove: (targetFolderId: number) => void | Promise<void>;
    handleCloseMainFilesBlockModal: () => void;
  };
  trashDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  restoreDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  archiveDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  unarchiveDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  batchArchiveDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  batchTrashDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  selectedDocumentIds: number[];
}

/** Renders upload side panel, single/batch confirm modals, and transfer-to-folder modal. */
export function DocumentsModals({
  t,
  modals,
  actions,
  trashDialog,
  restoreDialog,
  archiveDialog,
  unarchiveDialog,
  batchArchiveDialog,
  batchTrashDialog,
  selectedDocumentIds,
}: DocumentsModalsProps) {
  return (
    <>
      <UploadDocumentSidePanel
        isOpen={modals.isUploadOpen}
        onClose={actions.handleCloseUpload}
        onSuccess={actions.handleUploadSuccess}
      />
      <ConfirmModal
        {...trashDialog.modalProps}
        title={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        message={t("documents.confirmMoveToTrash", {
          defaultValue: "Are you sure you want to move this document to trash?",
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />
      <ConfirmModal
        {...restoreDialog.modalProps}
        title={t("documents.restore", { defaultValue: "Restore" })}
        message={t("documents.confirmRestore", {
          defaultValue: "Restore this document from trash?",
        })}
        confirmLabel={t("documents.restore", { defaultValue: "Restore" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="primary"
      />
      <ConfirmModal
        {...archiveDialog.modalProps}
        title={t("documents.archive", { defaultValue: "Archive" })}
        message={t("documents.confirmArchive", {
          defaultValue: "Are you sure you want to archive this document?",
        })}
        confirmLabel={t("documents.archive", { defaultValue: "Archive" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="secondary"
      />
      <ConfirmModal
        {...unarchiveDialog.modalProps}
        title={t("documents.unarchive", { defaultValue: "Unarchive" })}
        message={t("documents.confirmUnarchive", { defaultValue: "Unarchive this document?" })}
        confirmLabel={t("documents.unarchive", { defaultValue: "Unarchive" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="secondary"
      />
      <ConfirmModal
        {...batchArchiveDialog.modalProps}
        title={t("documents.archiveSelected", { defaultValue: "Archive selected" })}
        message={t("documents.confirmBatchArchive", {
          defaultValue: "Archive {{count}} document(s)?",
          count: selectedDocumentIds.length,
        })}
        confirmLabel={t("documents.archive", { defaultValue: "Archive" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="secondary"
      />
      <ConfirmModal
        {...batchTrashDialog.modalProps}
        title={t("documents.moveSelectedToTrash", { defaultValue: "Move selected to trash" })}
        message={t("documents.confirmBatchMoveToTrash", {
          defaultValue: "Move {{count}} document(s) to trash?",
          count: selectedDocumentIds.length,
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />
      <Modal
        isOpen={modals.mainFilesBlockModal.isOpen}
        onClose={actions.handleCloseMainFilesBlockModal}
        title={t("documents.cannotDeleteMainFiles", { defaultValue: "Cannot Delete Main Files" })}
        size="md"
      >
        <p className="mb-2">{t("documents.cannotDeleteMainFilesMessage", { defaultValue: "Main files of the folder cannot be moved to trash." })}</p>
        {modals.mainFilesBlockModal.mainFileNames.length > 0 && (
          <ul className="list-group list-group-flush mb-2">
            {modals.mainFilesBlockModal.mainFileNames.map((name, i) => (
              <li key={i} className="list-group-item py-1 px-2">
                {name}
              </li>
            ))}
          </ul>
        )}
        <p className="small text-muted mb-0">{t("documents.mainFilesUncheckedFooter", { defaultValue: "These files have been automatically unchecked." })}</p>
        <ModalFooter>
          <Button variant="primary" onClick={actions.handleCloseMainFilesBlockModal}>
            {t("common.ok", { defaultValue: "OK" })}
          </Button>
        </ModalFooter>
      </Modal>
      <TransferToFolderModal
        isOpen={modals.isMoveModalOpen}
        onClose={actions.handleCloseBatchMoveConfirm}
        departmentId={modals.moveDepartmentId}
        title={t("documents.transferToFolder", { defaultValue: "Transfer to folder" })}
        subtitle={t("documents.transferSubtitle", {
          defaultValue: "Transfer {{count}} document(s) to a folder in the same department.",
          count: modals.moveDocumentIdsCount,
        })}
        excludeFolderIds={modals.moveExcludeFolderIds.length > 0 ? modals.moveExcludeFolderIds : undefined}
        onConfirm={actions.handleConfirmBatchMove}
        isSubmitting={modals.isMoveSubmitting}
      />
    </>
  );
}
