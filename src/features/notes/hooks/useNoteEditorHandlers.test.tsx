import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useNoteEditorHandlers } from "./useNoteEditorHandlers";
import { makeNoteListItem } from "../../../test/fixtures/notes";

describe("useNoteEditorHandlers", () => {
  const mockRefreshNotes = vi.fn();
  const mockCreateNote = vi.fn();
  const mockUpdateNote = vi.fn();
  const mockDeleteNote = vi.fn();

  const defaultOptions = {
    refreshNotes: mockRefreshNotes,
    createNote: mockCreateNote,
    updateNote: mockUpdateNote,
    deleteNote: mockDeleteNote,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateNote.mockResolvedValue(100);
    mockUpdateNote.mockResolvedValue(true);
    mockDeleteNote.mockResolvedValue(true);
  });

  it("opens editor on handleCreateNote and merges createContext when saving new note", async () => {
    const { result } = renderHook(() =>
      useNoteEditorHandlers({
        ...defaultOptions,
        createContext: { folder_id: 5, department_id: 10 },
      })
    );

    expect(result.current.isNotesEditorOpen).toBe(false);

    act(() => {
      result.current.handleCreateNote();
    });
    expect(result.current.isNotesEditorOpen).toBe(true);
    expect(result.current.editingNote).toBeNull();

    await act(async () => {
      await result.current.handleSaveNote({ content: "New note", title: "Title" });
    });

    expect(mockCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "New note",
        title: "Title",
        folder_id: 5,
        department_id: 10,
      })
    );
    expect(mockRefreshNotes).toHaveBeenCalled();
    expect(result.current.isNotesEditorOpen).toBe(false);
  });

  it("opens editor with note on handleEditNote and calls updateNote when saving", async () => {
    const existing = makeNoteListItem({ id: 42, content: "Old", title: "Old Title" });
    const { result } = renderHook(() => useNoteEditorHandlers(defaultOptions));

    act(() => {
      result.current.handleEditNote(existing);
    });
    expect(result.current.isNotesEditorOpen).toBe(true);
    expect(result.current.editingNote?.id).toBe(42);

    await act(async () => {
      await result.current.handleSaveNote({ content: "Updated", title: "New Title" });
    });

    expect(mockUpdateNote).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ content: "Updated", title: "New Title" })
    );
    expect(mockCreateNote).not.toHaveBeenCalled();
    expect(mockRefreshNotes).toHaveBeenCalled();
  });

  it("confirmDeleteNote calls deleteNote and refreshNotes on success", async () => {
    const { result } = renderHook(() => useNoteEditorHandlers(defaultOptions));

    await act(async () => {
      await result.current.confirmDeleteNote(7);
    });

    expect(mockDeleteNote).toHaveBeenCalledWith(7);
    expect(mockRefreshNotes).toHaveBeenCalled();
  });

  it("handleViewNoteImage and handleCloseNoteImageViewer set viewer state", () => {
    const note = makeNoteListItem({ id: 1, title: "Img", image_filename: "x.png" });
    const { result } = renderHook(() => useNoteEditorHandlers(defaultOptions));

    act(() => {
      result.current.handleViewNoteImage(note);
    });
    expect(result.current.noteImageViewerId).toBe(1);
    expect(result.current.noteImageViewerTitle).toBe("Img");
    expect(result.current.noteImageViewerFilename).toBe("x.png");

    act(() => {
      result.current.handleCloseNoteImageViewer();
    });
    expect(result.current.noteImageViewerId).toBeNull();
    expect(result.current.noteImageViewerTitle).toBe("");
  });

  it("handleCloseNoteEditor closes editor and clears editing note", () => {
    const { result } = renderHook(() => useNoteEditorHandlers(defaultOptions));

    act(() => {
      result.current.handleEditNote(makeNoteListItem({ id: 1 }));
    });
    expect(result.current.isNotesEditorOpen).toBe(true);

    act(() => {
      result.current.handleCloseNoteEditor();
    });
    expect(result.current.isNotesEditorOpen).toBe(false);
    expect(result.current.editingNote).toBeNull();
  });
});
