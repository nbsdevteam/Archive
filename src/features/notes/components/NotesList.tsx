/**
 * Notes list component with sorting and empty state
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '../../../shared/components/ui';
import { NoteCard } from './NoteCard';
import type { NoteListItem } from '../types/notes.types';

export interface NotesListProps {
  notes: NoteListItem[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (note: NoteListItem) => void;
  onDelete?: (note: NoteListItem) => void;
  onViewImage?: (note: NoteListItem) => void;
  /** Callback when folder badge is clicked — receives the folder ID */
  onFolderClick?: (folderId: number) => void;
  showDocument?: boolean;
  showFolder?: boolean;
  emptyMessage?: string;
}

/**
 * Display a list of notes (pinned first, then by updated_at desc)
 */
export const NotesList = ({
  notes,
  loading,
  error,
  onEdit,
  onDelete,
  onViewImage,
  onFolderClick,
  showDocument = true,
  showFolder = true,
  emptyMessage,
}: NotesListProps) => {
  const { t } = useTranslation();

  // Sort: pinned first, then by updated_at descending
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [notes]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (sortedNotes.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <p>
          {emptyMessage ??
            t('notes.noNotes', { defaultValue: 'No notes found.' })}
        </p>
      </div>
    );
  }

  return (
    <div>
      {sortedNotes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewImage={onViewImage}
          onFolderClick={onFolderClick}
          showDocument={showDocument}
          showFolder={showFolder}
        />
      ))}
    </div>
  );
};
