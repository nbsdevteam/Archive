/**
 * Modal for viewing note images (lazy-loads via getNote)
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalFooter, Button, Spinner } from '../../../shared/components/ui';
import { useNoteDetail } from '../hooks/useNotes';
import { base64ImageToDataUrl } from '../types/notes.types';

export interface NoteImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: number | null;
  noteTitle?: string;
  imageFilename?: string;
}

/**
 * Display note image in a modal (fetches full note to get base64 image)
 */
export const NoteImageViewerModal = ({
  isOpen,
  onClose,
  noteId,
  noteTitle,
  imageFilename,
}: NoteImageViewerModalProps) => {
  const { t } = useTranslation();
  const { noteDetail, loading, error, fetchNote, clear } = useNoteDetail();

  useEffect(() => {
    if (isOpen && noteId) {
      fetchNote(noteId);
    } else {
      clear();
    }
  }, [isOpen, noteId, fetchNote, clear]);

  const imageDataUrl =
    noteDetail?.image && imageFilename
      ? base64ImageToDataUrl(noteDetail.image, imageFilename)
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        noteTitle
          ? t('notes.imageForNote', {
              defaultValue: 'Image: {{title}}',
              title: noteTitle,
            })
          : t('notes.noteImage', { defaultValue: 'Note image' })
      }
      size="lg"
    >
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 300 }}>
        {loading && (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner />
            <span className="ms-2">{t('notes.loadingImage', { defaultValue: 'Loading image...' })}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {t('notes.imageLoadError', {
              defaultValue: 'Failed to load image: {{error}}',
              error,
            })}
          </div>
        )}

        {!loading && !error && imageDataUrl && (
          <img
            src={imageDataUrl}
            alt={imageFilename ?? t('notes.noteImage', { defaultValue: 'Note image' })}
            className="img-fluid rounded"
            style={{ maxHeight: '70vh', objectFit: 'contain' }}
          />
        )}

        {!loading && !error && !imageDataUrl && (
          <p className="text-muted">
            {t('notes.noImageAvailable', { defaultValue: 'No image available.' })}
          </p>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('common.close', { defaultValue: 'Close' })}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
