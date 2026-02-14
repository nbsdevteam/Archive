/**
 * Shared hook for note editor and image viewer state/handlers.
 * Used by Folder detail, Document detail, and Notes page to avoid duplicating
 * isNotesEditorOpen, editingNote, note image viewer state, and create/edit/close/save/view handlers.
 */

import { useCallback, useState } from "react";
import type { NoteListItem, CreateNotePayload, UpdateNotePayload } from "../types/notes.types";

export interface UseNoteEditorHandlersOptions {
  /** Called after create/update/delete to refresh the notes list. */
  refreshNotes: () => void;
  createNote: (payload: CreateNotePayload) => Promise<number | null>;
  updateNote: (noteId: number, payload: UpdateNotePayload) => Promise<boolean>;
  deleteNote: (noteId: number) => Promise<boolean>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  /**
   * When creating a new note, these fields are merged into the payload
   * (e.g. folder_id from folder detail, document_id from document detail).
   * Omit or pass undefined for standalone notes page where the form supplies linking.
   */
  createContext?: {
    folder_id?: number;
    document_id?: number;
    department_id?: number;
  };
}

export interface UseNoteEditorHandlersReturn {
  isNotesEditorOpen: boolean;
  editingNote: NoteListItem | null;
  noteImageViewerId: number | null;
  noteImageViewerTitle: string;
  noteImageViewerFilename: string;
  handleCreateNote: () => void;
  handleEditNote: (note: NoteListItem) => void;
  handleCloseNoteEditor: () => void;
  /** Payload from NoteEditor; createContext is applied when creating. */
  handleSaveNote: (payload: CreateNotePayload) => Promise<void>;
  confirmDeleteNote: (noteId: number) => Promise<void>;
  handleViewNoteImage: (note: NoteListItem) => void;
  handleCloseNoteImageViewer: () => void;
  isCreatingNote: boolean;
  isUpdatingNote: boolean;
  isDeletingNote: boolean;
}

/**
 * Centralizes note editor and image viewer state and handlers so Folder detail,
 * Document detail, and Notes page can reuse the same logic without duplication.
 */
export function useNoteEditorHandlers(
  options: UseNoteEditorHandlersOptions
): UseNoteEditorHandlersReturn {
  const {
    refreshNotes,
    createNote,
    updateNote,
    deleteNote,
    isCreating,
    isUpdating,
    isDeleting,
    createContext,
  } = options;

  const [isNotesEditorOpen, setIsNotesEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteListItem | null>(null);
  const [noteImageViewerId, setNoteImageViewerId] = useState<number | null>(null);
  const [noteImageViewerTitle, setNoteImageViewerTitle] = useState("");
  const [noteImageViewerFilename, setNoteImageViewerFilename] = useState("");

  const handleCreateNote = useCallback(() => {
    setEditingNote(null);
    setIsNotesEditorOpen(true);
  }, []);

  const handleEditNote = useCallback((note: NoteListItem) => {
    setEditingNote(note);
    setIsNotesEditorOpen(true);
  }, []);

  const handleCloseNoteEditor = useCallback(() => {
    setIsNotesEditorOpen(false);
    setEditingNote(null);
  }, []);

  const handleSaveNote = useCallback(
    async (payload: CreateNotePayload) => {
      if (editingNote) {
        const updatePayload: UpdateNotePayload = {
          title: payload.title,
          content: payload.content,
          is_private: payload.is_private,
          is_pinned: payload.is_pinned,
          color: payload.color,
          image: payload.image,
          image_filename: payload.image_filename,
        };
        const success = await updateNote(editingNote.id, updatePayload);
        if (success) {
          handleCloseNoteEditor();
          refreshNotes();
        }
      } else {
        const createPayload = createContext
          ? { ...payload, ...createContext }
          : payload;
        const noteId = await createNote(createPayload);
        if (noteId != null) {
          handleCloseNoteEditor();
          refreshNotes();
        }
      }
    },
    [
      editingNote,
      createNote,
      updateNote,
      createContext,
      handleCloseNoteEditor,
      refreshNotes,
    ]
  );

  const confirmDeleteNote = useCallback(
    async (noteId: number) => {
      const success = await deleteNote(noteId);
      if (success) refreshNotes();
    },
    [deleteNote, refreshNotes]
  );

  const handleViewNoteImage = useCallback((note: NoteListItem) => {
    setNoteImageViewerId(note.id);
    setNoteImageViewerTitle(note.title ?? "");
    setNoteImageViewerFilename(note.image_filename ?? "");
  }, []);

  const handleCloseNoteImageViewer = useCallback(() => {
    setNoteImageViewerId(null);
    setNoteImageViewerTitle("");
    setNoteImageViewerFilename("");
  }, []);

  return {
    isNotesEditorOpen,
    editingNote,
    noteImageViewerId,
    noteImageViewerTitle,
    noteImageViewerFilename,
    handleCreateNote,
    handleEditNote,
    handleCloseNoteEditor,
    handleSaveNote,
    confirmDeleteNote,
    handleViewNoteImage,
    handleCloseNoteImageViewer,
    isCreatingNote: isCreating,
    isUpdatingNote: isUpdating,
    isDeletingNote: isDeleting,
  };
}
