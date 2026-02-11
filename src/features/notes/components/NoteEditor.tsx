/**
 * Note editor component for creating and editing notes
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Button, Icon, Input, SelectField } from '../../../shared/components/ui';
import { fileToBase64 } from '../../../shared/utils/files/fileToBase64';
import { NOTE_COLOR_NAMES, type NoteListItem, type NoteColorCode } from '../types/notes.types';
import type { Control } from 'react-hook-form';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export interface NoteEditorProps {
  /** Existing note to edit (null for create mode) */
  note?: NoteListItem | null;
  /** Pre-fill document link */
  documentId?: number;
  /** Pre-fill folder link */
  folderId?: number;
  /** Pre-fill department */
  departmentId?: number;
  /** Callback when save is clicked */
  onSave: (payload: {
    title?: string;
    content: string;
    is_private: boolean;
    is_pinned: boolean;
    color: NoteColorCode;
    image?: string;
    image_filename?: string;
  }) => void;
  /** Callback when cancel is clicked */
  onCancel: () => void;
  /** Is saving in progress */
  isSaving?: boolean;
}

/**
 * Form for creating or editing a note
 */
export const NoteEditor = ({
  note,
  documentId,
  folderId,
  departmentId,
  onSave,
  onCancel,
  isSaving = false,
}: NoteEditorProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [isPrivate, setIsPrivate] = useState(note?.is_private ?? true);
  const [isPinned, setIsPinned] = useState(note?.is_pinned ?? false);
  const [color, setColor] = useState<NoteColorCode>(note?.color ?? 0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const colorOptions = Object.entries(NOTE_COLOR_NAMES).map(([code, name]) => ({
    value: parseInt(code, 10),
    label: name,
  }));

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(
          t('notes.imageTooLarge', {
            defaultValue: 'Image size exceeds 5MB limit.',
          })
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error(
          t('notes.invalidImageType', {
            defaultValue: 'Please select a valid image file.',
          })
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        setSelectedFile(file);
        setImageBase64(base64);
      } catch (err) {
        toast.error(
          t('notes.imageUploadFailed', {
            defaultValue: 'Failed to process image.',
          })
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [t]
  );

  const handleClearImage = useCallback(() => {
    setSelectedFile(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim()) {
        toast.error(
          t('notes.contentRequired', {
            defaultValue: 'Note content is required.',
          })
        );
        return;
      }

      const payload: Parameters<typeof onSave>[0] = {
        title: title.trim() || undefined,
        content: content.trim(),
        is_private: isPrivate,
        is_pinned: isPinned,
        color,
      };

      if (imageBase64 && selectedFile) {
        payload.image = imageBase64;
        payload.image_filename = selectedFile.name;
      }

      onSave(payload);
    },
    [title, content, isPrivate, isPinned, color, imageBase64, selectedFile, onSave, t]
  );

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
      <Input
        label={t('notes.title', { defaultValue: 'Title (optional)' })}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('notes.titlePlaceholder', { defaultValue: 'Enter note title...' })}
        disabled={isSaving}
      />

      <div>
        <label className="form-label">
          {t('notes.content', { defaultValue: 'Content' })}
          <span className="text-danger ms-1">*</span>
        </label>
        <textarea
          className="form-control"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('notes.contentPlaceholder', {
            defaultValue: 'Enter note content...',
          })}
          required
          disabled={isSaving}
        />
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">
            {t('notes.visibility', { defaultValue: 'Visibility' })}
          </label>
          <select
            className="form-select"
            value={isPrivate ? 'private' : 'public'}
            onChange={(e) => setIsPrivate(e.target.value === 'private')}
            disabled={isSaving}
          >
            <option value="private">
              {t('notes.private', { defaultValue: 'Private' })}
            </option>
            <option value="public">
              {t('notes.public', { defaultValue: 'Public' })}
            </option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">
            {t('notes.color', { defaultValue: 'Color' })}
          </label>
          <select
            className="form-select"
            value={color}
            onChange={(e) => setColor(parseInt(e.target.value, 10) as NoteColorCode)}
            disabled={isSaving}
          >
            {colorOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="note-pinned"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
          disabled={isSaving}
        />
        <label className="form-check-label" htmlFor="note-pinned">
          <Icon name="paperclip" size={14} className="me-1" />
          {t('notes.pinNote', { defaultValue: 'Pin this note' })}
        </label>
      </div>

      <div>
        <label className="form-label">
          {t('notes.attachImage', { defaultValue: 'Attach image (optional)' })}
        </label>
        <input
          type="file"
          className="d-none"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          disabled={isSaving}
        />
        <div className="d-flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="btn-outline-secondary flex-grow-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
          >
            <Icon name="file-check" className="me-1" />
            {selectedFile
              ? t('notes.imageSelected', {
                  defaultValue: 'Selected: {{filename}}',
                  filename: selectedFile.name,
                })
              : t('notes.selectImage', { defaultValue: 'Select image' })}
          </Button>
          {selectedFile && (
            <Button
              type="button"
              variant="outline"
              className="btn-outline-danger"
              onClick={handleClearImage}
              disabled={isSaving}
            >
              <Icon name="x" />
            </Button>
          )}
        </div>
        <small className="text-muted">
          {t('notes.imageHint', { defaultValue: 'Max 5MB, image files only' })}
        </small>
      </div>

      <div className="d-flex gap-2 justify-content-end">
        <Button
          type="button"
          variant="outline"
          className="btn-outline-secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button type="submit" variant="secondary" isLoading={isSaving} disabled={isSaving}>
          {note
            ? t('notes.updateNote', { defaultValue: 'Update note' })
            : t('notes.createNote', { defaultValue: 'Create note' })}
        </Button>
      </div>
    </form>
  );
};
