import type { TFunction } from "i18next";
import { Modal, ModalFooter, Button, ConfirmModal, SidePanel } from "@/shared/components/ui";
import { useViewport } from "@/shared/hooks/useViewport";
import { TransferToFolderModal } from "@/shared/components/modals";
import { EditFolderSidePanel } from "@/features/folders/components";
import UploadDocumentSidePanel from "@/features/documents/components/UploadDocument/UploadDocumentSidePanel";
import { NoteEditor, NoteImageViewerModal } from "@/features/notes/components";
import type { FolderDetail } from "@/features/folders/types/folders.types";
import type { Document } from "@/app/adapter/api/documents.api";
import type { NoteListItem } from "@/features/notes/types/notes.types";

/** Props for all folder detail modals (signature, edit request, confirm dialogs, transfer, edit folder, upload, note editor, note image viewer). */
export interface FolderDetailModalsProps {
  t: TFunction;
  data: {
    folder: FolderDetail;
    folderId: number | null;
    mainDoc: Document | null;
    managers: Array<{ id: number; name: string; login?: string }>;
  };
  modals: {
    signatureOpen: boolean;
    signatureSignerId: number | "";
    signatureMessage: string;
    editOpen: boolean;
    editReason: string;
    isEditFolderOpen: boolean;
    isUploadOpen: boolean;
    uploadPanelInitialValues: Partial<{ upload_kind: "main" | "sub" | "attachment"; folder_id: number; department_id: number; target_document_id: number }>;
    uploadPanelLockFolderContext: boolean;
    transferModalOpen: boolean;
    transferMode: "attachments" | "docs" | null;
    transferDocIds: number[];
    transferAttachmentIds: number[];
    transferDepartmentId: number;
    isAttachmentPanelOpen: boolean;
    editAttachmentId: number | null;
    editAttachmentName: string;
    editAttachmentDescription: string;
    isNotesEditorOpen: boolean;
    editingNote: NoteListItem | null;
    noteImageViewerId: number | null;
    noteImageViewerTitle: string;
    noteImageViewerFilename: string;
  };
  actions: {
    setSignatureOpen: (v: boolean) => void;
    setSignatureSignerId: (v: number | "") => void;
    setSignatureMessage: (v: string) => void;
    submitSignature: () => void;
    setEditOpen: (v: boolean) => void;
    setEditReason: (v: string) => void;
    submitEditRequest: () => void;
    handleCloseEditFolder: () => void;
    handleEditFolderSuccess: () => void;
    closeTransferModal: () => void;
    handleTransferConfirm: (targetFolderId: number) => void | Promise<void>;
    handleCloseUploadPanel: () => void;
    handleCloseEditAttachment: () => void;
    setEditAttachmentName: (v: string) => void;
    setEditAttachmentDescription: (v: string) => void;
    handleConfirmEditAttachment: (replaceFile?: File | null) => void | Promise<void>;
    loadFolderDocuments: () => void;
    refreshAttachmentsForCurrentDocument: () => void;
    handleCloseNoteEditor: () => void;
    handleSaveNote: (payload: unknown) => void | Promise<void>;
    handleCloseNoteImageViewer: () => void;
  };
  loadingState: { transferSubmitting: boolean; isCreatingNote: boolean; isUpdatingNote: boolean; isUpdatingAttachment: boolean };
  selection: { subDocSelectedIds: (string | number)[]; attachmentSelectedIds: (string | number)[] };
  deleteFolderDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  subDocTrashDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  batchSubDocTrashDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  attachmentTrashDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  batchAttachmentTrashDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
  noteDeleteDialog: { modalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean } };
}

/** Renders all folder detail modals: signature, edit request, confirm dialogs, transfer, edit folder panel, upload panel, note editor, note image viewer. */
export function FolderDetailModals({
  t,
  data,
  modals,
  actions,
  loadingState,
  selection,
  deleteFolderDialog,
  subDocTrashDialog,
  batchSubDocTrashDialog,
  attachmentTrashDialog,
  batchAttachmentTrashDialog,
  noteDeleteDialog,
}: FolderDetailModalsProps) {
  const { isMobileView } = useViewport();
  const handleCloseSignatureModal = () => actions.setSignatureOpen(false);
  const handleSignatureSignerChange = (e: React.ChangeEvent<HTMLSelectElement>) => actions.setSignatureSignerId(e.target.value ? Number(e.target.value) : "");
  const handleSignatureMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => actions.setSignatureMessage(e.target.value);

  const handleCloseEditModal = () => actions.setEditOpen(false);
  const handleEditReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => actions.setEditReason(e.target.value);

  const handleUploadSuccess = () => {
    actions.loadFolderDocuments();
    actions.refreshAttachmentsForCurrentDocument();
    actions.handleCloseUploadPanel();
  };

  return (
    <>
      <Modal isOpen={modals.signatureOpen} onClose={handleCloseSignatureModal} title={t("folders.signatureRequestOnMain", { defaultValue: "Request signature (main document)" })} size="md">
        {data.mainDoc && <p className="small mb-2">{data.mainDoc.title ?? data.mainDoc.name} — {data.mainDoc.barcode}</p>}
        <div className="mb-3">
          <label className="form-label" htmlFor="folder-modal-signer">{t("folders.signerRequired", { defaultValue: "Signer" })} *</label>
          <select id="folder-modal-signer" className="form-select" value={modals.signatureSignerId} onChange={handleSignatureSignerChange} aria-label={t("folders.signerRequired", { defaultValue: "Signer" })}>
            <option value="">{t("folders.selectSigner", { defaultValue: "Select signer…" })}</option>
            {data.managers.map((m) => <option key={m.id} value={m.id}>{m.name} {m.login ? `(${m.login})` : ""}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="folder-modal-signature-message">{t("folders.messageOptional", { defaultValue: "Message (optional)" })}</label>
          <textarea id="folder-modal-signature-message" className="form-control" rows={3} value={modals.signatureMessage} onChange={handleSignatureMessageChange} aria-label={t("folders.messageOptional", { defaultValue: "Message (optional)" })} />
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={handleCloseSignatureModal}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button variant="secondary" disabled={!modals.signatureSignerId} onClick={actions.submitSignature}>{t("folders.create", { defaultValue: "Create" })}</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={modals.editOpen} onClose={handleCloseEditModal} title={t("folders.editRequestOnMain", { defaultValue: "Edit request (main document)" })} size="md">
        {data.mainDoc && <p className="small mb-2">{data.mainDoc.title ?? data.mainDoc.name} — {data.mainDoc.barcode}</p>}
        <div className="mb-3">
          <label className="form-label" htmlFor="folder-modal-edit-reason">{t("folders.editReasonRequired", { defaultValue: "Reason" })} *</label>
          <textarea id="folder-modal-edit-reason" className="form-control" rows={4} value={modals.editReason} onChange={handleEditReasonChange} aria-label={t("folders.editReasonRequired", { defaultValue: "Reason" })} />
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={handleCloseEditModal}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button variant="secondary" disabled={!data.mainDoc || !modals.editReason.trim()} onClick={actions.submitEditRequest}>{t("folders.create", { defaultValue: "Create" })}</Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal {...deleteFolderDialog.modalProps} title={t("folders.deleteFolder", { defaultValue: "Delete folder" })} message={t("folders.confirmDeleteFolder", { defaultValue: "Are you sure you want to delete this folder? Documents may be affected." })} confirmLabel={t("folders.delete", { defaultValue: "Delete" })} cancelLabel={t("common.cancel")} confirmVariant="danger" />
      <ConfirmModal {...subDocTrashDialog.modalProps} title={t("documents.moveToTrash", { defaultValue: "Move to trash" })} message={t("documents.confirmMoveToTrash", { defaultValue: "Are you sure you want to move this document to trash?" })} confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })} cancelLabel={t("common.cancel", { defaultValue: "Cancel" })} confirmVariant="danger" />
      <ConfirmModal {...batchSubDocTrashDialog.modalProps} title={t("documents.moveSelectedToTrash", { defaultValue: "Move selected to trash" })} message={t("documents.confirmBatchMoveToTrash", { defaultValue: "Move {{count}} document(s) to trash?", count: selection.subDocSelectedIds.length })} confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })} cancelLabel={t("common.cancel", { defaultValue: "Cancel" })} confirmVariant="danger" />
      <ConfirmModal {...attachmentTrashDialog.modalProps} title={t("documents.deleteAttachment", { defaultValue: "Delete" })} message={t("documents.confirmDeleteAttachment", { defaultValue: "Are you sure you want to delete this attachment? This cannot be undone." })} confirmLabel={t("documents.deleteAttachment", { defaultValue: "Delete" })} cancelLabel={t("common.cancel", { defaultValue: "Cancel" })} confirmVariant="danger" />
      <ConfirmModal {...batchAttachmentTrashDialog.modalProps} title={t("documents.deleteSelectedAttachments", { defaultValue: "Delete selected" })} message={t("documents.confirmBatchDeleteAttachments", { defaultValue: "Delete {{count}} attachment(s)? This cannot be undone.", count: selection.attachmentSelectedIds.length })} confirmLabel={t("documents.deleteAttachment", { defaultValue: "Delete" })} cancelLabel={t("common.cancel", { defaultValue: "Cancel" })} confirmVariant="danger" />

      <TransferToFolderModal
        isOpen={modals.transferModalOpen}
        onClose={actions.closeTransferModal}
        departmentId={modals.transferDepartmentId}
        title={t("folders.selectDestinationFolder", { defaultValue: "Select destination folder" })}
        subtitle={modals.transferMode === "docs" ? t("folders.transferSubtitleDocs", { count: modals.transferDocIds.length, defaultValue: "Transfer {{count}} document(s) to a folder in the same department." }) : modals.transferMode === "attachments" ? t("folders.transferSubtitleAttachments", { count: modals.transferAttachmentIds.length, defaultValue: "Transfer {{count}} attachment(s) to a folder in the same department." }) : undefined}
        excludeFolderId={data.folderId ?? undefined}
        onConfirm={actions.handleTransferConfirm}
        isSubmitting={loadingState.transferSubmitting}
      />

      <EditFolderSidePanel isOpen={modals.isEditFolderOpen} onClose={actions.handleCloseEditFolder} folder={data.folder} onSuccess={actions.handleEditFolderSuccess} />

      <UploadDocumentSidePanel
        isOpen={modals.isUploadOpen}
        onClose={actions.handleCloseUploadPanel}
        onSuccess={handleUploadSuccess}
        initialValues={modals.uploadPanelInitialValues}
        lockFolderContext={modals.uploadPanelLockFolderContext}
      />

      <SidePanel
        isOpen={modals.isNotesEditorOpen}
        onClose={actions.handleCloseNoteEditor}
        title={modals.editingNote ? t("notes.editNote", { defaultValue: "Edit note" }) : t("notes.createNote", { defaultValue: "Create note" })}
        width={isMobileView ? "100vw" : "50vw"}
        loading={loadingState.isCreatingNote || loadingState.isUpdatingNote}
        closeOnBackdropClick={false}
      >
        <NoteEditor
          note={modals.editingNote}
          folderId={data.folderId ?? undefined}
          departmentId={data.folder?.department_id}
          onSave={actions.handleSaveNote}
          onCancel={actions.handleCloseNoteEditor}
          isSaving={loadingState.isCreatingNote || loadingState.isUpdatingNote}
        />
      </SidePanel>

      <NoteImageViewerModal isOpen={modals.noteImageViewerId != null} onClose={actions.handleCloseNoteImageViewer} noteId={modals.noteImageViewerId} noteTitle={modals.noteImageViewerTitle} imageFilename={modals.noteImageViewerFilename} />

      <ConfirmModal {...noteDeleteDialog.modalProps} title={t("notes.deleteNote", { defaultValue: "Delete note" })} message={t("notes.confirmDelete", { defaultValue: "Are you sure you want to delete this note? This action cannot be undone." })} confirmLabel={t("common.delete", { defaultValue: "Delete" })} cancelLabel={t("common.cancel", { defaultValue: "Cancel" })} confirmVariant="danger" />
    </>
  );
}
