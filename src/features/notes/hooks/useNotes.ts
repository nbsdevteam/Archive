/**
 * Reusable hooks for Notes CRUD operations
 * Supports three contexts: document notes, folder notes, or standalone notes
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { handleApiError } from '../../../app/adapter/api/client';
import {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} from '../services/notes.api';
import type {
  NoteListItem,
  NoteDetail,
  ListNotesParams,
  CreateNotePayload,
  UpdateNotePayload,
} from '../types/notes.types';

/** Hook options for context-specific notes */
export interface UseNotesOptions {
  /** Filter by document ID */
  documentId?: number;
  /** Filter by folder ID */
  folderId?: number;
  /** Include private notes (default true) */
  includePrivate?: boolean;
  /** Auto-load on mount (default true) */
  autoLoad?: boolean;
  /** Items per page (default 50) */
  perPage?: number;
}

/**
 * Hook for managing notes list with pagination and CRUD operations
 */
export const useNotes = (options: UseNotesOptions = {}) => {
  const { t } = useTranslation();
  const {
    documentId,
    folderId,
    includePrivate = true,
    autoLoad = true,
    perPage = 50,
  } = options;

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: perPage,
    total_pages: 0,
  });

  /**
   * Load notes list with current filters and pagination
   */
  const loadNotes = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const params: ListNotesParams = {
          page,
          per_page: perPage,
          include_private: includePrivate,
        };

        if (documentId) params.document_id = documentId;
        if (folderId) params.folder_id = folderId;

        const response = await listNotes(params);

        if (response.success && response.data) {
          setNotes(response.data);
          if (response.pagination) {
            setPagination(response.pagination);
          }
        } else {
          setNotes([]);
        }
      } catch (err) {
        const msg = handleApiError(err);
        setError(msg);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    },
    [documentId, folderId, includePrivate, perPage]
  );

  /**
   * Refresh current page
   */
  const refresh = useCallback(() => {
    loadNotes(pagination.page);
  }, [loadNotes, pagination.page]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    (page: number) => {
      loadNotes(page);
    },
    [loadNotes]
  );

  /**
   * Auto-load on mount or when filters change
   */
  useEffect(() => {
    if (autoLoad) {
      loadNotes(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, documentId, folderId, includePrivate, perPage]);

  return {
    notes,
    loading,
    error,
    pagination,
    loadNotes,
    refresh,
    goToPage,
  };
};

/**
 * Hook for note mutation operations (create, update, delete)
 */
export const useNoteMutations = () => {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Create a new note
   */
  const create = useCallback(
    async (payload: CreateNotePayload): Promise<number | null> => {
      setIsCreating(true);
      try {
        const response = await createNote(payload);
        if (response.success) {
          toast.success(
            t('notes.createSuccess', { defaultValue: 'Note created successfully.' })
          );
          return response.data?.id ?? null;
        }
        throw new Error(response.error ?? 'Create failed');
      } catch (err) {
        const msg = handleApiError(err);
        toast.error(
          t('notes.createFailed', {
            defaultValue: 'Failed to create note: {{error}}',
            error: msg,
          })
        );
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [t]
  );

  /**
   * Update an existing note
   */
  const update = useCallback(
    async (noteId: number, payload: UpdateNotePayload): Promise<boolean> => {
      setIsUpdating(true);
      try {
        const response = await updateNote(noteId, payload);
        if (response.success) {
          toast.success(
            t('notes.updateSuccess', { defaultValue: 'Note updated successfully.' })
          );
          return true;
        }
        throw new Error(response.error ?? 'Update failed');
      } catch (err) {
        const msg = handleApiError(err);
        toast.error(
          t('notes.updateFailed', {
            defaultValue: 'Failed to update note: {{error}}',
            error: msg,
          })
        );
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [t]
  );

  /**
   * Delete a note
   */
  const remove = useCallback(
    async (noteId: number): Promise<boolean> => {
      setIsDeleting(true);
      try {
        await deleteNote(noteId);
        toast.success(
          t('notes.deleteSuccess', { defaultValue: 'Note deleted successfully.' })
        );
        return true;
      } catch (err) {
        const msg = handleApiError(err);
        toast.error(
          t('notes.deleteFailed', {
            defaultValue: 'Failed to delete note: {{error}}',
            error: msg,
          })
        );
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [t]
  );

  return {
    create,
    update,
    remove,
    isCreating,
    isUpdating,
    isDeleting,
  };
};

/**
 * Hook for fetching a single note with image (lazy load)
 */
export const useNoteDetail = () => {
  const [noteDetail, setNoteDetail] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch a single note by ID (includes base64 image if present)
   */
  const fetchNote = useCallback(async (noteId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getNote(noteId);
      if (response.success && response.data) {
        setNoteDetail(response.data);
      } else {
        throw new Error('Failed to fetch note');
      }
    } catch (err) {
      const msg = handleApiError(err);
      setError(msg);
      setNoteDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear loaded note
   */
  const clear = useCallback(() => {
    setNoteDetail(null);
    setError(null);
  }, []);

  return {
    noteDetail,
    loading,
    error,
    fetchNote,
    clear,
  };
};
