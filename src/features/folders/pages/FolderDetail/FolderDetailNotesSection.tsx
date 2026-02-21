import type { TFunction } from "i18next";
import { Button, Icon } from "@/shared/components/ui";
import { NotesList } from "@/features/notes/components";
import type { NoteListItem } from "@/features/notes/types/notes.types";

export interface FolderDetailNotesSectionProps {
  t: TFunction;
  notes: NoteListItem[];
  loadingNotes: boolean;
  notesError: string | null;
  onLoadNotes: () => void;
  onCreateNote: () => void;
  onEditNote: (note: NoteListItem) => void;
  onDeleteNote: (noteId: number) => void;
  onViewNoteImage: (note: NoteListItem) => void;
}

/** Folder notes card: NotesList with refresh and create note buttons. */
export function FolderDetailNotesSection({
  t,
  notes,
  loadingNotes,
  notesError,
  onLoadNotes,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onViewNoteImage,
}: FolderDetailNotesSectionProps) {
  return (
    <div className="card mb-3" style={{ borderTop: 0 }}>
      <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h4 className="mb-0">
          <Icon name="file-text" className="me-2" />
          {t("notes.folderNotes", { defaultValue: "Folder Notes" })}
        </h4>
        <div className="d-flex gap-2">
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={onLoadNotes}>
            <Icon name="refresh-cw" className="me-1" />
            {t("common.refresh", { defaultValue: "Refresh" })}
          </Button>
          <Button variant="secondary" size="sm" onClick={onCreateNote}>
            <Icon name="upload" className="me-1" />
            {t("notes.createNote", { defaultValue: "Create note" })}
          </Button>
        </div>
      </div>
      <div className="card-body">
        <NotesList
          notes={notes}
          loading={loadingNotes}
          error={notesError}
          onEdit={onEditNote}
          onDelete={(note) => onDeleteNote(note.id)}
          onViewImage={onViewNoteImage}
          showDocument={true}
          showFolder={false}
          emptyMessage={t("notes.noNotesForFolder", { defaultValue: "No notes found for this folder." })}
        />
      </div>
    </div>
  );
}
