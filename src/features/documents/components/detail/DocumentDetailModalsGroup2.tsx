import { SidePanel } from "@/shared/components/ui";
import { useViewport } from "@/shared/hooks/useViewport";
import { NoteEditor, NoteImageViewerModal } from "@/features/notes/components";
import type { DocumentDetailModalsGroup2Props } from "./DocumentDetailModals";

/** Note editor sidebar and note image viewer modal (edit attachment uses the attachment sidebar). */
export function DocumentDetailModalsGroup2({ t, data, loading, modals, actions }: DocumentDetailModalsGroup2Props) {
  const { isMobileView } = useViewport();
  return (
    <>
      <SidePanel
        isOpen={modals.isNotesEditorOpen}
        onClose={actions.handleCloseNoteEditor}
        title={modals.editingNote ? t("notes.editNote", { defaultValue: "Edit note" }) : t("notes.createNote", { defaultValue: "Create note" })}
        width={isMobileView ? "100vw" : "50vw"}
        loading={loading.isCreatingNote || loading.isUpdatingNote}
        closeOnBackdropClick={false}
      >
        <NoteEditor
          note={modals.editingNote as Parameters<typeof NoteEditor>[0]["note"]}
          documentId={data.docId ?? undefined}
          departmentId={data.doc?.department_id}
          onSave={actions.handleSaveNote}
          onCancel={actions.handleCloseNoteEditor}
          isSaving={loading.isCreatingNote || loading.isUpdatingNote}
        />
      </SidePanel>

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
