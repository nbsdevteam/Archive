/**
 * Note card component for displaying individual note items
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, InfoWrapper } from '../../../shared/components/ui';
import { convertToArabianStandardTime } from '../../../shared/utils/format/date';
import { NOTE_COLOR_NAMES, type NoteListItem } from '../types/notes.types';

export interface NoteCardProps {
  note: NoteListItem;
  onEdit?: (note: NoteListItem) => void;
  onDelete?: (note: NoteListItem) => void;
  onViewImage?: (note: NoteListItem) => void;
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

/** Convert HEX color to rgba for note card tint/background usage. */
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
  showDocument = true,
  showFolder = true,
}: NoteCardProps) => {
  const { t } = useTranslation();

  const colorName = NOTE_COLOR_NAMES[note.color] ?? NOTE_COLOR_NAMES[0];
  const noteColor = NOTE_COLOR_HEX_MAP[note.color] ?? NOTE_COLOR_HEX_MAP[0];
  const noteTint = hexToRgba(noteColor, 0.12);
  const noteSoftBorder = hexToRgba(noteColor, 0.35);
  const noteStrongBorder = hexToRgba(noteColor, 0.75);

  const contentPreview = useMemo(() => {
    const text = note.content ?? '';
    if (text.length <= 200) return text;
    return text.substring(0, 200) + '...';
  }, [note.content]);

  return (
    <div
      className="card mb-2"
      style={{
        borderTop: '0',
        borderLeft: `4px solid ${noteStrongBorder}`,
        borderRight: `1px solid ${noteSoftBorder}`,
        borderBottom: `1px solid ${noteSoftBorder}`,
        backgroundColor: noteTint,
      }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            {note.title && (
              <h6 className="card-title mb-1" style={{ color: noteColor }}>
                {note.title}
              </h6>
            )}
            <div className="d-flex flex-wrap gap-1 mb-2">
              {note.is_pinned && (
                <span
                  className="badge"
                  style={{
                    color: noteColor,
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
                    color: noteColor,
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
                    color: noteColor,
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
                    color: noteColor,
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
                    color: noteColor,
                    backgroundColor: hexToRgba(noteColor, 0.16),
                    border: `1px solid ${noteSoftBorder}`,
                    cursor: onViewImage ? 'pointer' : 'default',
                  }}
                  onClick={() => onViewImage?.(note)}
                  disabled={!onViewImage}
                >
                  <Icon name="file-check" className="me-1" size={12} />
                  {t('notes.hasImage', { defaultValue: 'Image' })}
                </button>
              )}
            </div>
          </div>
          <div className="d-flex gap-1">
            {note.has_image && onViewImage && (
              <InfoWrapper
                content={t('notes.viewImage', { defaultValue: 'View image' })}
                position="top"
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-outline-info"
                    onClick={() => onViewImage(note)}
                  >
                    <Icon name="eye" size={14} />
                  </Button>
                }
              />
            )}
            {onEdit && (
              <InfoWrapper
                content={t('common.edit', { defaultValue: 'Edit' })}
                position="top"
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-outline-secondary"
                    onClick={() => onEdit(note)}
                  >
                    <Icon name="edit" size={14} />
                  </Button>
                }
              />
            )}
            {onDelete && (
              <InfoWrapper
                content={t('common.delete', { defaultValue: 'Delete' })}
                position="top"
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-outline-danger"
                    onClick={() => onDelete(note)}
                  >
                    <Icon name="trash" size={14} />
                  </Button>
                }
              />
            )}
          </div>
        </div>
        <p
          className="card-text small mb-2"
          style={{ whiteSpace: 'pre-wrap', color: noteColor }}
        >
          {contentPreview}
        </p>
        <div className="d-flex flex-wrap gap-2 align-items-center small" style={{ color: noteColor }}>
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
            <span>
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
            {convertToArabianStandardTime(note.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
};
