/**
 * Reusable hooks for Notes CRUD operations
 * Supports three contexts: document notes, folder notes, or standalone notes
 */

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { handleApiError } from "../../../app/adapter/api/client";
import {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} from "../services/notes.api";
import type {
  NoteListItem,
  NoteDetail,
  ListNotesParams,
  CreateNotePayload,
  UpdateNotePayload,
} from "../types/notes.types";
import { useInfiniteList } from "../../../shared/hooks/useInfiniteList";
import { queryKeys } from "../../../shared/lib/queryKeys";
import { invalidateNotes } from "../../../shared/lib/queryInvalidation";

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

const EMPTY_NOTES: NoteListItem[] = [];

/**
 * Standalone Notes page list: every note, loaded as the user scrolls.
 */
export const useInfiniteNotes = (options: { includePrivate?: boolean; perPage?: number } = {}) => {
  const { includePrivate = true, perPage = 50 } = options;
  const { items, loading, error, refetch, paging } = useInfiniteList({
    queryKey: queryKeys.notes.infinite({ include_private: includePrivate, per_page: perPage }),
    perPage,
    fetchPage: (page, per_page) => listNotes({ page, per_page, include_private: includePrivate }),
    getItems: (response) => (response.success ? response.data : EMPTY_NOTES),
    getMeta: (response) => response.pagination,
    getItemId: (note: NoteListItem) => note.id,
  });
  return { notes: items, loading, error, refresh: refetch, paging };
};

/**
 * Hook for one page of notes in a document/folder context, cached per context.
 */
export const useNotes = (options: UseNotesOptions = {}) => {
  const {
    documentId,
    folderId,
    includePrivate = true,
    autoLoad = true,
    perPage = 50,
  } = options;

  const [page, setPage] = useState(1);
  const [loadRequested, setLoadRequested] = useState(false);

  const params: ListNotesParams = {
    page,
    per_page: perPage,
    include_private: includePrivate,
    ...(documentId ? { document_id: documentId } : {}),
    ...(folderId ? { folder_id: folderId } : {}),
  };

  const query = useQuery({
    queryKey: queryKeys.notes.list(params),
    queryFn: () => listNotes(params),
    enabled: autoLoad || loadRequested,
  });

  const response = query.data;
  const notes = response?.success && response.data ? response.data : EMPTY_NOTES;
  const pagination = response?.pagination ?? { total: 0, page, per_page: perPage, total_pages: 0 };
  const { refetch } = query;

  /** Refresh current page */
  const refresh = useCallback(() => refetch(), [refetch]);

  /** Load a specific page (also starts loading when autoLoad is false). */
  const loadNotes = useCallback((nextPage = 1) => {
    setPage(nextPage);
    setLoadRequested(true);
  }, []);

  return {
    notes,
    loading: query.isLoading,
    error: query.isError ? handleApiError(query.error) : null,
    pagination,
    loadNotes,
    refresh,
    goToPage: loadNotes,
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
          void invalidateNotes();
          toast.success(
            t("notes.createSuccess", {
              defaultValue: "Note created successfully.",
            }),
          );
          return response.data?.id ?? null;
        }
        throw new Error(response.error ?? "Create failed");
      } catch (err) {
        const msg = handleApiError(err);
        toast.error(
          t("notes.createFailed", {
            defaultValue: "Failed to create note: {{error}}",
            error: msg,
          }),
        );
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [t],
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
          void invalidateNotes();
          toast.success(
            t("notes.updateSuccess", {
              defaultValue: "Note updated successfully.",
            }),
          );
          return true;
        }
        throw new Error(response.error ?? "Update failed");
      } catch (err) {
        const msg = handleApiError(err);
        toast.error(
          t("notes.updateFailed", {
            defaultValue: "Failed to update note: {{error}}",
            error: msg,
          }),
        );
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [t],
  );

  /**
   * Delete a note
   */
  const remove = useCallback(
    async (noteId: number): Promise<boolean> => {
      setIsDeleting(true);
      try {
        await deleteNote(noteId);
        void invalidateNotes();
        toast.success(
          t("notes.deleteSuccess", {
            defaultValue: "Note deleted successfully.",
          }),
        );
        return true;
      } catch (err) {
        const msg = handleApiError(err);
        toast.error(
          t("notes.deleteFailed", {
            defaultValue: "Failed to delete note: {{error}}",
            error: msg,
          }),
        );
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [t],
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
        throw new Error("Failed to fetch note");
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
