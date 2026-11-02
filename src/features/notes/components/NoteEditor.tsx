/**
 * Note editor component for creating and editing notes.
 * Supports standalone mode (from /notes page) with a folder linking dropdown,
 * and contextual mode (from folder/document detail pages) where linking is pre-filled.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Button, Icon, Input } from '../../../shared/components/ui';
import { fileToBase64 } from '../../../shared/utils/files/fileToBase64';
import { NOTE_COLOR_NAMES, type NoteListItem, type NoteColorCode } from '../types/notes.types';
import { fetchFoldersCached } from '../../../shared/lib/cachedReads';
import type { Folder } from '../../folders/types/folders.types';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/** Payload shape emitted by onSave — includes optional folder/document linking fields */
export interface NoteEditorSavePayload {
  title?: string;
  content: string;
  is_private: boolean;
  is_pinned: boolean;
  color: NoteColorCode;
  image?: string;
  image_filename?: string;
  folder_id?: number;
  document_id?: number;
}

export interface NoteEditorProps {
  /** Existing note to edit (null for create mode) */
  note?: NoteListItem | null;
  /** Pre-fill document link (contextual mode — hides the dropdowns) */
  documentId?: number;
  /** Pre-fill folder link (contextual mode — hides the dropdowns) */
  folderId?: number;
  /** Pre-fill department */
  departmentId?: number;
  /** Callback when save is clicked */
  onSave: (payload: NoteEditorSavePayload) => void;
  /** Callback when cancel is clicked */
  onCancel: () => void;
  /** Is saving in progress */
  isSaving?: boolean;
}

/**
 * Form for creating or editing a note.
 * In standalone mode (no folderId/documentId props), renders linked folder + document
 * dropdowns so the user can optionally link the note to an existing folder/document.
 */
export const NoteEditor = ({
  note,
  documentId,
  folderId,
  departmentId: _departmentId,
  onSave,
  onCancel,
  isSaving = false,
}: NoteEditorProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Core note fields ──
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [isPrivate, setIsPrivate] = useState(note?.is_private ?? true);
  const [isPinned, setIsPinned] = useState(note?.is_pinned ?? false);
  const [color, setColor] = useState<NoteColorCode>(note?.color ?? 0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // ── Standalone-mode folder linking state ──
  /** True when the parent did NOT pre-supply folder/document IDs — user must choose */
  const isStandaloneMode = !folderId && !documentId;

  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    note?.folder_id ?? null
  );

  /** Memoised color dropdown options — computed once */
  const colorOptions = useMemo(
    () =>
      Object.entries(NOTE_COLOR_NAMES).map(([code, name]) => ({
        value: parseInt(code, 10),
        label: name,
      })),
    []
  );

  /** Memoised folder dropdown options */
  const folderOptions = useMemo(
    () =>
      folders.map((f) => ({
        value: f.id,
        label: `${f.name}${f.code ? ` — ${f.code}` : ''}`,
      })),
    [folders]
  );

  // ── Fetch all folders on mount (standalone mode only) ──
  useEffect(() => {
    if (!isStandaloneMode) return;

    let cancelled = false;
    setLoadingFolders(true);

    fetchFoldersCached()
      .then((res) => {
        if (!cancelled) setFolders(res.folders ?? []);
      })
      .catch(() => {
        if (!cancelled) setFolders([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingFolders(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isStandaloneMode]);

  /** Handle folder dropdown change */
  const handleFolderChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSelectedFolderId(val ? parseInt(val, 10) : null);
    },
    []
  );

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

  /** Build and emit the save payload, including optional folder/document linking */
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

      const payload: NoteEditorSavePayload = {
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

      // Attach folder/document linking — use prop values when in contextual mode,
      // or user-selected folder when in standalone mode
      if (isStandaloneMode) {
        if (selectedFolderId) payload.folder_id = selectedFolderId;
      } else {
        if (folderId) payload.folder_id = folderId;
        if (documentId) payload.document_id = documentId;
      }

      onSave(payload);
    },
    [
      title, content, isPrivate, isPinned, color,
      imageBase64, selectedFile, onSave, t,
      isStandaloneMode, selectedFolderId,
      folderId, documentId,
    ]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value);
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value);
  const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => setIsPrivate(e.target.value === 'private');
  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => setColor(parseInt(e.target.value, 10) as NoteColorCode);
  const handlePinnedChange = (e: React.ChangeEvent<HTMLInputElement>) => setIsPinned(e.target.checked);
  const handleSelectImageClick = () => fileInputRef.current?.click();

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
      {/* ── Folder linking (standalone mode only) ── */}
      {isStandaloneMode && (
        <div>
          <label className="form-label">
            {t('notes.folder', { defaultValue: 'Folder' })}
          </label>
          <select
            className="form-select"
            value={selectedFolderId ?? ''}
            onChange={handleFolderChange}
            disabled={isSaving || loadingFolders}
          >
            <option value="">
              {loadingFolders
                ? t('common.loading', { defaultValue: 'Loading...' })
                : `— ${t('notes.noFolder', { defaultValue: 'None' })} —`}
            </option>
            {folderOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <Input
        label={t('notes.title', { defaultValue: 'Title (optional)' })}
        value={title}
        onChange={handleTitleChange}
        placeholder={t('notes.titlePlaceholder', { defaultValue: 'Enter note title...' })}
        disabled={isSaving}
      />

      <div>
        <label className="form-label" htmlFor="note-content">
          {t('notes.content', { defaultValue: 'Content' })}
          <span className="text-danger ms-1">*</span>
        </label>
        <textarea
          id="note-content"
          className="form-control"
          rows={6}
          value={content}
          onChange={handleContentChange}
          placeholder={t('notes.contentPlaceholder', {
            defaultValue: 'Enter note content...',
          })}
          required
          disabled={isSaving}
          aria-label={t('notes.content', { defaultValue: 'Content' })}
        />
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label" htmlFor="note-visibility">
            {t('notes.visibility', { defaultValue: 'Visibility' })}
          </label>
          <select
            id="note-visibility"
            className="form-select"
            value={isPrivate ? 'private' : 'public'}
            onChange={handleVisibilityChange}
            disabled={isSaving}
            aria-label={t('notes.visibility', { defaultValue: 'Visibility' })}
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
          <label className="form-label" htmlFor="note-color">
            {t('notes.color', { defaultValue: 'Color' })}
          </label>
          <select
            id="note-color"
            className="form-select"
            value={color}
            onChange={handleColorChange}
            disabled={isSaving}
            aria-label={t('notes.color', { defaultValue: 'Color' })}
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
          onChange={handlePinnedChange}
          disabled={isSaving}
        />
        <label className="form-check-label" htmlFor="note-pinned">
          <Icon name="paperclip" size={14} className="me-1" />
          {t('notes.pinNote', { defaultValue: 'Pin this note' })}
        </label>
      </div>

      <div>
        <label className="form-label" htmlFor="note-attach-image">
          {t('notes.attachImage', { defaultValue: 'Attach image (optional)' })}
        </label>
        <input
          id="note-attach-image"
          type="file"
          className="d-none"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          disabled={isSaving}
          aria-label={t('notes.attachImage', { defaultValue: 'Attach image (optional)' })}
        />
        <div className="d-flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="btn-outline-secondary flex-grow-1"
            onClick={handleSelectImageClick}
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
