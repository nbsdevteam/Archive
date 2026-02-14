import { Button, Modal, ModalFooter, Spinner } from "../../../../shared/components/ui";
import { NoteEditor, NoteImageViewerModal } from "../../../notes/components";
import type { DocumentDetailModalsProps } from "./DocumentDetailModals";

/** Edit attachment, note editor, note image viewer modals. */
export function DocumentDetailModalsGroup2({ t, data, loading, modals, actions }: DocumentDetailModalsProps) {
  return (
    <>
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
        title={modals.editingNote ? t("notes.editNote", { defaultValue: "Edit note" }) : t("notes.createNote", { defaultValue: "Create note" })}
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
    </>
  );
}
