/**
 * Notes list component with sorting and empty state
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '../../../shared/components/ui';
import { useWindowVirtualList } from '../../../shared/hooks/useWindowVirtualList';
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
  /** Render only the notes near the viewport; for long lists on the page scroll. */
  virtualize?: boolean;
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
  virtualize = false,
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

  const getItemKey = useCallback((index: number) => sortedNotes[index].id, [sortedNotes]);
  const virtualList = useWindowVirtualList<HTMLDivElement>({
    count: sortedNotes.length,
    estimateSize: 180,
    getItemKey,
    overscan: 3,
    enabled: virtualize && !loading && !error && sortedNotes.length > 0,
  });

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

  const renderNote = (note: NoteListItem) => (
    <NoteCard
      note={note}
      onEdit={onEdit}
      onDelete={onDelete}
      onViewImage={onViewImage}
      onFolderClick={onFolderClick}
      showDocument={showDocument}
      showFolder={showFolder}
    />
  );

  if (virtualize) {
    return (
      <div
        ref={virtualList.containerRef}
        style={{ paddingTop: virtualList.paddingTop, paddingBottom: virtualList.paddingBottom, overflowAnchor: 'none' }}
      >
        {virtualList.virtualItems.map((item) => (
          // flow-root keeps the card's margin inside the measured height.
          <div key={item.key} ref={virtualList.measureElement} data-index={item.index} style={{ display: 'flow-root' }}>
            {renderNote(sortedNotes[item.index])}
          </div>
        ))}
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
