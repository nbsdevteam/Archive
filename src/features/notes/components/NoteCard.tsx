/**
 * Note card component for displaying individual note items
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '../../../shared/components/ui';
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

  const contentPreview = useMemo(() => {
    const text = note.content ?? '';
    if (text.length <= 200) return text;
    return text.substring(0, 200) + '...';
  }, [note.content]);

  // Map color codes to Bootstrap color classes
  const colorClassMap: Record<number, string> = {
    0: 'secondary',
    1: 'danger',
    2: 'primary',
    3: 'success',
    4: 'warning',
    5: 'warning',
    6: 'info',
    7: 'danger',
    8: 'dark',
    9: 'secondary',
  };
  const colorClass = colorClassMap[note.color] ?? 'secondary';

  return (
    <div className={`card mb-2 border-start border-${colorClass} border-3`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            {note.title && <h6 className="card-title mb-1">{note.title}</h6>}
            <div className="d-flex flex-wrap gap-1 mb-2">
              {note.is_pinned && (
                <span className="badge bg-warning text-dark">
                  <Icon name="paperclip" className="me-1" size={12} />
                  {t('notes.pinned', { defaultValue: 'Pinned' })}
                </span>
              )}
              {note.is_private ? (
                <span className="badge bg-secondary">
                  <Icon name="eye-off" className="me-1" size={12} />
                  {t('notes.private', { defaultValue: 'Private' })}
                </span>
              ) : (
                <span className="badge bg-success">
                  <Icon name="eye" className="me-1" size={12} />
                  {t('notes.public', { defaultValue: 'Public' })}
                </span>
              )}
              {note.color !== 0 && (
                <span className={`badge bg-${colorClass}`}>
                  {colorName}
                </span>
              )}
              {note.has_image && (
                <span className="badge bg-info">
                  <Icon name="file-check" className="me-1" size={12} />
                  {t('notes.hasImage', { defaultValue: 'Image' })}
                </span>
              )}
            </div>
          </div>
          <div className="d-flex gap-1">
            {note.has_image && onViewImage && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline-info"
                onClick={() => onViewImage(note)}
                title={t('notes.viewImage', { defaultValue: 'View image' })}
              >
                <Icon name="eye" size={14} />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline-secondary"
                onClick={() => onEdit(note)}
                title={t('common.edit', { defaultValue: 'Edit' })}
              >
                <Icon name="edit" size={14} />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline-danger"
                onClick={() => onDelete(note)}
                title={t('common.delete', { defaultValue: 'Delete' })}
              >
                <Icon name="trash" size={14} />
              </Button>
            )}
          </div>
        </div>
        <p className="card-text text-muted small mb-2" style={{ whiteSpace: 'pre-wrap' }}>
          {contentPreview}
        </p>
        <div className="d-flex flex-wrap gap-2 align-items-center text-muted small">
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
