import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../../app/providers/AppProviders";
import { makeNoteListItem } from "../../../test/fixtures/notes";
import { useNotes, useNoteMutations } from "./useNotes";

const mockListNotes = vi.fn();
const mockCreateNote = vi.fn();
const mockUpdateNote = vi.fn();
const mockDeleteNote = vi.fn();

vi.mock("../services/notes.api", () => ({
  listNotes: (...args: unknown[]) => mockListNotes(...args),
  getNote: vi.fn(),
  createNote: (...args: unknown[]) => mockCreateNote(...args),
  updateNote: (...args: unknown[]) => mockUpdateNote(...args),
  deleteNote: (...args: unknown[]) => mockDeleteNote(...args),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <AppProviders>{children}</AppProviders>
    </MemoryRouter>
  );
}

describe("useNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListNotes.mockResolvedValue({ success: true, data: [], pagination: { total: 0, page: 1, per_page: 50, total_pages: 0 } });
  });

  it("lists notes with folderId when autoLoad is true", async () => {
    const notes = [makeNoteListItem({ id: 1, folder_id: 10 }), makeNoteListItem({ id: 2, folder_id: 10 })];
    mockListNotes.mockResolvedValue({
      success: true,
      data: notes,
      pagination: { total: 2, page: 1, per_page: 50, total_pages: 1 },
    });

    const { result } = renderHook(() => useNotes({ folderId: 10, autoLoad: true }), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockListNotes).toHaveBeenCalledWith(
      expect.objectContaining({ folder_id: 10, page: 1, per_page: 50 })
    );
    expect(result.current.notes).toHaveLength(2);
    expect(result.current.notes[0].id).toBe(1);
  });

  it("does not load when autoLoad is false until loadNotes is called", async () => {
    const { result } = renderHook(() => useNotes({ folderId: 10, autoLoad: false }), { wrapper });

    await waitFor(() => expect(mockListNotes).not.toHaveBeenCalled());
    expect(result.current.notes).toHaveLength(0);

    mockListNotes.mockResolvedValue({ success: true, data: [makeNoteListItem()] });
    result.current.loadNotes(1);
    await waitFor(() => expect(mockListNotes).toHaveBeenCalledWith(expect.objectContaining({ folder_id: 10 })));
    await waitFor(() => expect(result.current.notes).toHaveLength(1));
  });
});

describe("useNoteMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateNote.mockResolvedValue({ success: true, data: { id: 1, created_at: "2024-01-01T00:00:00Z" } });
    mockUpdateNote.mockResolvedValue({ success: true, data: { updated_at: "2024-01-01T00:00:00Z" } });
    mockDeleteNote.mockResolvedValue({ success: true });
  });

  it("calls createNote and returns note id on success", async () => {
    const { result } = renderHook(() => useNoteMutations(), { wrapper });

    const id = await result.current.create({
      content: "New content",
      title: "Title",
      folder_id: 1,
    });

    expect(mockCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({ content: "New content", title: "Title", folder_id: 1 })
    );
    expect(id).toBe(1);
  });

  it("sets isCreating while create is in progress", async () => {
    let resolveCreate: (value: unknown) => void;
    mockCreateNote.mockImplementation(() => new Promise((r) => { resolveCreate = r; }));

    const { result } = renderHook(() => useNoteMutations(), { wrapper });
    expect(result.current.isCreating).toBe(false);

    const createPromise = result.current.create({ content: "C", folder_id: 1 });
    await waitFor(() => expect(result.current.isCreating).toBe(true));

    resolveCreate!({ success: true, data: { id: 1 } });
    await createPromise;
    await waitFor(() => expect(result.current.isCreating).toBe(false));
  });

  it("calls updateNote and returns true on success", async () => {
    const { result } = renderHook(() => useNoteMutations(), { wrapper });

    const ok = await result.current.update(5, { content: "Updated", title: "New Title" });

    expect(mockUpdateNote).toHaveBeenCalledWith(5, expect.objectContaining({ content: "Updated", title: "New Title" }));
    expect(ok).toBe(true);
  });

  it("calls deleteNote and returns true on success", async () => {
    const { result } = renderHook(() => useNoteMutations(), { wrapper });

    const ok = await result.current.remove(5);

    expect(mockDeleteNote).toHaveBeenCalledWith(5);
    expect(ok).toBe(true);
  });

  it("sets isDeleting while remove is in progress", async () => {
    let resolveDelete: (value: unknown) => void;
    mockDeleteNote.mockImplementation(() => new Promise((r) => { resolveDelete = r; }));

    const { result } = renderHook(() => useNoteMutations(), { wrapper });
    const removePromise = result.current.remove(1);
    await waitFor(() => expect(result.current.isDeleting).toBe(true));

    resolveDelete!({ success: true });
    await removePromise;
    await waitFor(() => expect(result.current.isDeleting).toBe(false));
  });
});
