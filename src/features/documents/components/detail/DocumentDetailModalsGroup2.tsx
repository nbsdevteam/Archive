import { Modal } from "@/shared/components/ui";
import { NoteEditor, NoteImageViewerModal } from "@/features/notes/components";
import type { DocumentDetailModalsGroup2Props } from "./DocumentDetailModals";

/** Note editor and note image viewer modals (edit attachment uses the attachment sidebar). */
export function DocumentDetailModalsGroup2({ t, data, loading, modals, actions }: DocumentDetailModalsGroup2Props) {
  return (
    <>
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
