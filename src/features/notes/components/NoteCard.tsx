/**
 * Note card component for displaying individual note items
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '../../../shared/components/ui';
import { NOTE_COLOR_NAMES, type NoteListItem } from '../types/notes.types';

export interface NoteCardProps {
  note: NoteListItem;
  onEdit?: (note: NoteListItem) => void;
  onDelete?: (note: NoteListItem) => void;
  onViewImage?: (note: NoteListItem) => void;
  /** Callback when folder badge is clicked — receives the folder ID */
  onFolderClick?: (folderId: number) => void;
  showDocument?: boolean;
  showFolder?: boolean;
}

const NOTE_COLOR_HEX_MAP: Record<number, string> = {
  0: '#6c757d',
  1: '#dc3545',
  2: '#0d6efd',
  3: '#198754',
  4: '#ffc107',
  5: '#fd7e14',
  6: '#6f42c1',
  7: '#d63384',
  8: '#8b5e3c',
  9: '#6c757d',
};

/** Convert HEX color to rgba for note card borders and badge backgrounds. */
function hexToRgba(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  const value =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex;
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * Display a single note as a card with badges and actions
 */
export const NoteCard = ({
  note,
  onEdit,
  onDelete,
  onViewImage,
  onFolderClick,
  showDocument = true,
  showFolder = true,
}: NoteCardProps) => {
  const { t } = useTranslation();

  const colorName = NOTE_COLOR_NAMES[note.color] ?? NOTE_COLOR_NAMES[0];
  const noteColor = NOTE_COLOR_HEX_MAP[note.color] ?? NOTE_COLOR_HEX_MAP[0];
  const noteSoftBorder = hexToRgba(noteColor, 0.35);
  const noteStrongBorder = hexToRgba(noteColor, 0.75);

  const contentPreview = useMemo(() => {
    const text = note.content ?? '';
    if (text.length <= 200) return text;
    return text.substring(0, 200) + '...';
  }, [note.content]);

  const getViewImageClickHandler = (n: NoteListItem) => () => onViewImage?.(n);
  const getEditClickHandler = (n: NoteListItem) => () => onEdit?.(n);
  const getDeleteClickHandler = (n: NoteListItem) => () => onDelete?.(n);
  const getFolderClickHandler = (folderId: number) => () => onFolderClick?.(folderId);
  const getFolderKeyDownHandler = (folderId: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') onFolderClick?.(folderId);
  };

  return (
    <div
      className="card mb-2"
      style={{
        borderTop: '1px solid var(--bs-border-color)',
        borderLeft: `4px solid ${noteStrongBorder}`,
        borderRight: `1px solid ${noteSoftBorder}`,
        borderBottom: `1px solid ${noteSoftBorder}`,
      }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            {note.title && (
              <h6 className="card-title mb-1">
                {note.title}
              </h6>
            )}
            <div className="d-flex flex-wrap gap-1 mb-2">
              {note.is_pinned && (
                <span
                  className="badge"
                  style={{
                    color: 'var(--bs-body-color)',
                    backgroundColor: hexToRgba(noteColor, 0.16),
                    border: `1px solid ${noteSoftBorder}`,
                  }}
                >
                  <Icon name="paperclip" className="me-1" size={12} />
                  {t('notes.pinned', { defaultValue: 'Pinned' })}
                </span>
              )}
              {note.is_private ? (
                <span
                  className="badge"
                  style={{
                    color: 'var(--bs-body-color)',
                    backgroundColor: hexToRgba(noteColor, 0.16),
                    border: `1px solid ${noteSoftBorder}`,
                  }}
                >
                  <Icon name="eye-off" className="me-1" size={12} />
                  {t('notes.private', { defaultValue: 'Private' })}
                </span>
              ) : (
                <span
                  className="badge"
                  style={{
                    color: 'var(--bs-body-color)',
                    backgroundColor: hexToRgba(noteColor, 0.16),
                    border: `1px solid ${noteSoftBorder}`,
                  }}
                >
                  <Icon name="eye" className="me-1" size={12} />
                  {t('notes.public', { defaultValue: 'Public' })}
                </span>
              )}
              {note.color !== 0 && (
                <span
                  className="badge"
                  style={{
                    color: 'var(--bs-body-color)',
                    backgroundColor: hexToRgba(noteColor, 0.16),
                    border: `1px solid ${noteSoftBorder}`,
                  }}
                >
                  {colorName}
                </span>
              )}
              {note.has_image && (
                <button
                  type="button"
                  className="badge border-0"
                  style={{
                    color: 'var(--bs-body-color)',
                    backgroundColor: hexToRgba(noteColor, 0.16),
                    border: `1px solid ${noteSoftBorder}`,
                    cursor: onViewImage ? 'pointer' : 'default',
                  }}
                  onClick={getViewImageClickHandler(note)}
                  disabled={!onViewImage}
                >
                  <Icon name="file-check" className="me-1" size={12} />
                  {t('notes.hasImage', { defaultValue: 'Image' })}
                </button>
              )}
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {note.has_image && onViewImage && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline-info d-inline-flex align-items-center"
                onClick={getViewImageClickHandler(note)}
                aria-label={t('notes.viewImage', { defaultValue: 'View image' })}
              >
                <Icon name="eye" size={14} className="me-1" />
                {t('notes.viewImage', { defaultValue: 'View image' })}
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline-secondary d-inline-flex align-items-center"
                onClick={getEditClickHandler(note)}
                aria-label={t('common.edit', { defaultValue: 'Edit' })}
              >
                <Icon name="pencil" size={14} className="me-1" />
                {t('common.edit', { defaultValue: 'Edit' })}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline-danger d-inline-flex align-items-center"
                onClick={getDeleteClickHandler(note)}
                aria-label={t('common.delete', { defaultValue: 'Delete' })}
              >
                <Icon name="trash-2" size={14} className="me-1" />
                {t('common.delete', { defaultValue: 'Delete' })}
              </Button>
            )}
          </div>
        </div>
        <p
          className="card-text small mb-2"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {contentPreview}
        </p>
        <div className="d-flex flex-wrap gap-2 align-items-center small mobile-margin-block-5 text-body">
          <span>
            <Icon name="user" size={12} className="me-1" />
            {note.user_name}
          </span>
          {showDocument && note.document_id && note.document_title && (
            <span>
              <Icon name="file-text" size={12} className="me-1" />
              {note.document_title}
            </span>
          )}
          {showFolder && note.folder_id && note.folder_name && (
            <span
              role={onFolderClick ? 'button' : undefined}
              tabIndex={onFolderClick ? 0 : undefined}
              style={onFolderClick ? { cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' } : undefined}
              onClick={onFolderClick && note.folder_id != null ? getFolderClickHandler(note.folder_id) : undefined}
              onKeyDown={onFolderClick && note.folder_id != null ? getFolderKeyDownHandler(note.folder_id) : undefined}
            >
              <Icon name="folder" size={12} className="me-1" />
              {note.folder_name}
            </span>
          )}
          {note.department_name && (
            <span>
              <Icon name="home" size={12} className="me-1" />
              {note.department_name}
            </span>
          )}
          <span className="ms-auto">
            {note.updated_at ?? ""}
          </span>
        </div>
      </div>
    </div>
  );
};
