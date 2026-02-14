import { Button, Modal, ModalFooter, Spinner, ConfirmModal, Icon } from "../../../../shared/components/ui";
import { NoteEditor, NoteImageViewerModal } from "../../../notes/components";
import type { TFunction } from "i18next";
import type { CreateNotePayload } from "../../../notes/types/notes.types";

/** Props for document detail modals: modal state, actions, loading, data needed by modals, and confirm dialog spread props. */
export interface DocumentDetailModalsProps {
  t: TFunction;
  data: {
    docId: number | null;
    doc: { department_id?: number } | null;
    approvedRequests: Array<{ id: number; signer_name?: string }>;
    managers: Array<{ id: number; name: string; login?: string }>;
  };
  loading: {
    uploadingVersion: boolean;
    uploadingSigned: boolean;
    addingRelation: boolean;
    isUpdatingAttachment: boolean;
    isCreatingNote: boolean;
    isUpdatingNote: boolean;
  };
  modals: {
    modalUploadVersion: boolean;
    uploadVersionFile: File | null;
    uploadVersionUnlockToken: string;
    uploadVersionDescription: string;
    uploadVersionInputRef: React.RefObject<HTMLInputElement | null>;
    modalRequestSign: boolean;
    selectedSignerId: string | number;
    signMessage: string;
    modalUploadSigned: boolean;
    selectedApprovedReqId: number | null;
    signToken: string;
    signedFile: File | null;
    signedFileInputRef: React.RefObject<HTMLInputElement | null>;
    modalAddRelation: boolean;
    relatedDocId: string;
    relationNotes: string;
    isEditAttachmentModalOpen: boolean;
    editAttachmentName: string;
    editAttachmentDescription: string;
    isNotesEditorOpen: boolean;
    editingNote: unknown;
    noteImageViewerId: number | null;
    noteImageViewerTitle: string;
    noteImageViewerFilename: string;
  };
  actions: {
    setModalUploadVersion: (v: boolean) => void;
    setUploadVersionUnlockToken: (v: string) => void;
    setUploadVersionDescription: (v: string) => void;
    setUploadVersionFile: (f: File | null) => void;
    handleClearUploadVersionFile: () => void;
    handleUploadVersionSubmit: () => void;
    setModalRequestSign: (v: boolean) => void;
    setSelectedSignerId: React.Dispatch<React.SetStateAction<number | "">>;
    setSignMessage: (v: string) => void;
    handleCreateSignatureRequest: () => void;
    setModalUploadSigned: (v: boolean) => void;
    setSelectedApprovedReqId: (v: number | null) => void;
    setSignToken: (v: string) => void;
    setSignedFile: (f: File | null) => void;
    handleClearSignedFile: () => void;
    handleUploadSignedSubmit: () => void;
    setModalAddRelation: (v: boolean) => void;
    setRelatedDocId: (v: string) => void;
    setRelationNotes: (v: string) => void;
    handleAddRelationSubmit: () => void;
    handleCloseEditAttachment: () => void;
    setEditAttachmentName: (v: string) => void;
    setEditAttachmentDescription: (v: string) => void;
    handleConfirmEditAttachment: () => void;
    handleCloseNoteEditor: () => void;
    handleSaveNote: (payload: Omit<CreateNotePayload, "document_id">) => Promise<void>;
    handleCloseNoteImageViewer: () => void;
  };
  selection: { attachmentSelectedIds: (string | number)[] };
  attachmentTrashModalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading?: boolean };
  batchAttachmentTrashModalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading?: boolean };
  noteDeleteModalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading?: boolean };
}

/** Renders all document detail modals (upload version, request sign, upload signed, add relation, edit attachment, note editor, note image viewer, confirm dialogs). */
export const DocumentDetailModals = ({
  t,
  data,
  loading,
  modals,
  actions,
  selection,
  attachmentTrashModalProps,
  batchAttachmentTrashModalProps,
  noteDeleteModalProps,
}: DocumentDetailModalsProps) => {
  return (
    <>
      <Modal
        isOpen={modals.modalUploadVersion}
        onClose={() => actions.setModalUploadVersion(false)}
        title={t("documents.uploadNewVersion", { defaultValue: "Upload new version" })}
        size="md"
      >
        <div className="mb-3">
          <label className="form-label">{t("documents.unlockToken", { defaultValue: "Unlock token" })} *</label>
          <input
            type="text"
            className="form-control"
            value={modals.uploadVersionUnlockToken}
            onChange={(e) => actions.setUploadVersionUnlockToken(e.target.value)}
            placeholder={t("documents.unlockTokenPlaceholder", { defaultValue: "Enter unlock token" })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.changeDescription", { defaultValue: "Change description" })}</label>
          <input
            type="text"
            className="form-control"
            value={modals.uploadVersionDescription}
            onChange={(e) => actions.setUploadVersionDescription(e.target.value)}
            placeholder={t("documents.changeDescriptionPlaceholder", { defaultValue: "Optional" })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.file", { defaultValue: "File" })} *</label>
          <div className="d-flex gap-2 align-items-center">
            <input
              ref={modals.uploadVersionInputRef}
              type="file"
              className="form-control"
              onChange={(e) => actions.setUploadVersionFile(e.target.files?.[0] ?? null)}
            />
            {modals.uploadVersionFile && (
              <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleClearUploadVersionFile}>
                <Icon name="x" className="me-1" />
                {t("common.remove", { defaultValue: "Remove" })}
              </Button>
            )}
          </div>
          {modals.uploadVersionFile && <small className="text-muted d-block mt-1">{modals.uploadVersionFile.name}</small>}
        </div>
        <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
          <Button variant="outline" className="btn-outline-secondary" onClick={() => actions.setModalUploadVersion(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant="secondary"
            disabled={!modals.uploadVersionFile || !modals.uploadVersionUnlockToken.trim() || loading.uploadingVersion}
            onClick={actions.handleUploadVersionSubmit}
          >
            {loading.uploadingVersion ? <Spinner /> : t("documents.upload", { defaultValue: "Upload" })}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={modals.modalRequestSign}
        onClose={() => actions.setModalRequestSign(false)}
        title={t("documents.requestSignature", { defaultValue: "Request signature" })}
        size="md"
      >
        <div className="mb-3">
          <label className="form-label">{t("documents.selectManager", { defaultValue: "Select manager" })}</label>
          <select
            className="form-select"
            value={String(modals.selectedSignerId)}
            onChange={(e) => actions.setSelectedSignerId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">{t("common.select", { defaultValue: "Select…" })}</option>
            {data.managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.login ? `(${m.login})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.notesOptional", { defaultValue: "Notes (optional)" })}</label>
          <textarea
            className="form-control"
            rows={3}
            value={modals.signMessage}
            onChange={(e) => actions.setSignMessage(e.target.value)}
          />
        </div>
        <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
          <Button variant="outline" className="btn-outline-secondary" onClick={() => actions.setModalRequestSign(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button variant="secondary" disabled={!modals.selectedSignerId} onClick={actions.handleCreateSignatureRequest}>
            {t("documents.send", { defaultValue: "Send" })}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={modals.modalUploadSigned}
        onClose={() => actions.setModalUploadSigned(false)}
        title={t("documents.uploadSignedVersion", { defaultValue: "Upload signed version" })}
        size="md"
      >
        <div className="mb-3">
          <label className="form-label">{t("documents.selectApprovedRequest", { defaultValue: "Select approved request" })}</label>
          <select
            className="form-select"
            value={modals.selectedApprovedReqId ?? ""}
            onChange={(e) => actions.setSelectedApprovedReqId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t("common.select", { defaultValue: "Select…" })}</option>
            {data.approvedRequests.map((r: { id: number; signer_name?: string }) => (
              <option key={r.id} value={r.id}>
                #{r.id} • {r.signer_name ?? "–"}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.signToken", { defaultValue: "Sign token" })}</label>
          <input
            type="text"
            className="form-control"
            value={modals.signToken}
            onChange={(e) => actions.setSignToken(e.target.value)}
            placeholder={t("documents.signTokenPlaceholder", { defaultValue: "Enter token from approval email" })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.selectSignedFile", { defaultValue: "Signed file" })}</label>
          <div className="d-flex gap-2 align-items-center">
            <input
              ref={modals.signedFileInputRef}
              type="file"
              className="form-control"
              onChange={(e) => actions.setSignedFile(e.target.files?.[0] ?? null)}
            />
            {modals.signedFile && (
              <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleClearSignedFile}>
                <Icon name="x" className="me-1" />
                {t("common.remove", { defaultValue: "Remove" })}
              </Button>
            )}
          </div>
          {modals.signedFile && <small className="text-muted d-block mt-1">{modals.signedFile.name}</small>}
        </div>
        <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
          <Button variant="outline" className="btn-outline-secondary" onClick={() => actions.setModalUploadSigned(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant="secondary"
            disabled={
              !modals.selectedApprovedReqId || !modals.signedFile || !modals.signToken.trim() || loading.uploadingSigned
            }
            onClick={actions.handleUploadSignedSubmit}
          >
            {loading.uploadingSigned ? <Spinner /> : t("documents.upload", { defaultValue: "Upload" })}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={modals.modalAddRelation}
        onClose={() => actions.setModalAddRelation(false)}
        title={t("documents.addRelation", { defaultValue: "Add relation" })}
        size="md"
      >
        <div className="mb-3">
          <label className="form-label">{t("documents.relatedDocumentId", { defaultValue: "Related document ID" })} *</label>
          <input
            type="number"
            className="form-control"
            value={modals.relatedDocId}
            onChange={(e) => actions.setRelatedDocId(e.target.value)}
            placeholder={t("documents.relatedDocumentIdPlaceholder", { defaultValue: "Document ID" })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.notesOptional", { defaultValue: "Notes (optional)" })}</label>
          <textarea
            className="form-control"
            rows={2}
            value={modals.relationNotes}
            onChange={(e) => actions.setRelationNotes(e.target.value)}
          />
        </div>
        <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
          <Button variant="outline" className="btn-outline-secondary" onClick={() => actions.setModalAddRelation(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant="secondary"
            disabled={!modals.relatedDocId.trim() || loading.addingRelation}
            onClick={actions.handleAddRelationSubmit}
          >
            {loading.addingRelation ? <Spinner /> : t("common.add", { defaultValue: "Add" })}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal
        {...attachmentTrashModalProps}
        title={t("documents.deleteAttachment", { defaultValue: "Delete" })}
        message={t("documents.confirmDeleteAttachment", {
          defaultValue: "Are you sure you want to delete this attachment? This cannot be undone.",
        })}
        confirmLabel={t("documents.deleteAttachment", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...batchAttachmentTrashModalProps}
        title={t("documents.deleteSelectedAttachments", { defaultValue: "Delete selected" })}
        message={t("documents.confirmBatchDeleteAttachments", {
          defaultValue: "Delete {{count}} attachment(s)? This cannot be undone.",
          count: selection.attachmentSelectedIds.length,
        })}
        confirmLabel={t("documents.deleteAttachment", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <Modal
        isOpen={modals.isEditAttachmentModalOpen}
        onClose={actions.handleCloseEditAttachment}
        title={t("common.edit", { defaultValue: "Edit" })}
        size="md"
      >
        <div className="mb-3">
          <label className="form-label">{t("documents.name", { defaultValue: "Name" })}</label>
          <input
            type="text"
            className="form-control"
            value={modals.editAttachmentName}
            onChange={(e) => actions.setEditAttachmentName(e.target.value)}
            maxLength={255}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.description", { defaultValue: "Description" })}</label>
          <textarea
            className="form-control"
            rows={3}
            value={modals.editAttachmentDescription}
            onChange={(e) => actions.setEditAttachmentDescription(e.target.value)}
          />
        </div>
        <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
          <Button variant="outline" className="btn-outline-secondary" onClick={actions.handleCloseEditAttachment}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant="secondary"
            onClick={actions.handleConfirmEditAttachment}
            disabled={!modals.editAttachmentName.trim() || loading.isUpdatingAttachment}
          >
            {loading.isUpdatingAttachment ? <Spinner /> : t("common.save", { defaultValue: "Save" })}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={modals.isNotesEditorOpen}
        onClose={actions.handleCloseNoteEditor}
        title={
          modals.editingNote
            ? t("notes.editNote", { defaultValue: "Edit note" })
            : t("notes.createNote", { defaultValue: "Create note" })
        }
        size="lg"
      >
        <NoteEditor
          note={modals.editingNote as Parameters<typeof NoteEditor>[0]["note"]}
          documentId={data.docId ?? undefined}
          departmentId={data.doc?.department_id}
          onSave={actions.handleSaveNote}
          onCancel={actions.handleCloseNoteEditor}
          isSaving={loading.isCreatingNote || loading.isUpdatingNote}
        />
      </Modal>

      <NoteImageViewerModal
        isOpen={modals.noteImageViewerId != null}
        onClose={actions.handleCloseNoteImageViewer}
        noteId={modals.noteImageViewerId}
        noteTitle={modals.noteImageViewerTitle}
        imageFilename={modals.noteImageViewerFilename}
      />

      <ConfirmModal
        {...noteDeleteModalProps}
        title={t("notes.deleteNote", { defaultValue: "Delete note" })}
        message={t("notes.confirmDelete", {
          defaultValue: "Are you sure you want to delete this note? This action cannot be undone.",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />
    </>
  );
};
