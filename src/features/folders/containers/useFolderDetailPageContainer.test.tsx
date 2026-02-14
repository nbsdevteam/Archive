import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import { renderHookWithProviders } from "../../../test/testUtils/renderWithProviders";
import { resetStores } from "../../../test/testUtils/resetStores";
import { makeDocument } from "../../../test/fixtures/documents";
import { makeFolderDetail } from "../../../test/fixtures/folders";
import { makeNoteListItem } from "../../../test/fixtures/notes";
import { useFolderDetailPageContainer } from "./useFolderDetailPageContainer";

const mockGetFolderDocuments = vi.fn();
const mockGetFolder = vi.fn();
const mockDeleteFolder = vi.fn();
const mockBatchMoveDocumentsToFolder = vi.fn();
const mockListAttachments = vi.fn();
const mockListNotes = vi.fn();
const mockCreateNote = vi.fn();
const mockUpdateNote = vi.fn();
const mockDeleteNote = vi.fn();

vi.mock("../services/folders.api", () => ({
  getFolderDocuments: (...args: unknown[]) => mockGetFolderDocuments(...args),
  getFolder: (...args: unknown[]) => mockGetFolder(...args),
  deleteFolder: (...args: unknown[]) => mockDeleteFolder(...args),
  updateFolder: vi.fn(),
}));

vi.mock("../../../app/adapter/api/documents.api", () => ({
  documentsApi: {
    batchMoveDocumentsToFolder: (...args: unknown[]) => mockBatchMoveDocumentsToFolder(...args),
    listAttachments: (...args: unknown[]) => mockListAttachments(...args),
    downloadDocument: vi.fn().mockResolvedValue(new Blob()),
    deleteAttachment: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock("../../../app/adapter/api/admin.api", () => ({
  adminApi: {
    getManagers: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

vi.mock("../../activity/hooks/useFolderAuditLogs", () => ({
  useFolderAuditLogs: () => ({
    logs: [],
    loading: false,
    error: null,
    documentCount: 0,
    refresh: vi.fn(),
  }),
}));

vi.mock("../../notes/services/notes.api", () => ({
  listNotes: (...args: unknown[]) => mockListNotes(...args),
  createNote: (...args: unknown[]) => mockCreateNote(...args),
  updateNote: (...args: unknown[]) => mockUpdateNote(...args),
  deleteNote: (...args: unknown[]) => mockDeleteNote(...args),
}));

vi.mock("../../signatures/stores/signatureStore", () => ({
  useSignatureStore: () => ({ createRequest: vi.fn() }),
}));

vi.mock("../../../app/adapter/api/editRequests.api", () => ({
  editRequestsApi: { createRequest: vi.fn() },
}));

const folderId = 123;
const initialEntries = [`/folders/${folderId}`];
const routePath = "/folders/:id";

describe("useFolderDetailPageContainer", () => {
  const folder = makeFolderDetail({ id: folderId, name: "Test Folder", department_id: 10 });
  const mainDoc = makeDocument({ id: 1, department_id: 10, upload_date: "2024-01-01T00:00:00Z" });
  const subDoc = makeDocument({ id: 2, department_id: 10, upload_date: "2024-01-02T00:00:00Z" });

  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockGetFolderDocuments.mockResolvedValue({ folder, data: [mainDoc, subDoc] });
    mockGetFolder.mockResolvedValue(folder);
    mockDeleteFolder.mockResolvedValue({ ok: true });
    mockBatchMoveDocumentsToFolder.mockResolvedValue({ success: true });
    mockListAttachments.mockResolvedValue({ success: true, data: [] });
    mockListNotes.mockResolvedValue({ success: true, data: [] });
    mockCreateNote.mockResolvedValue({ success: true, data: { id: 1 } });
    mockUpdateNote.mockResolvedValue({ success: true });
    mockDeleteNote.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    resetStores();
  });

  it("renders without throwing (smoke test)", () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });
    expect(result.current).toBeDefined();
    expect(result.current.data).toBeDefined();
    expect(result.current.actions).toBeDefined();
    expect(result.current.modals).toBeDefined();
  });

  it("loads folder and documents from getFolderDocuments on mount", async () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => {
      expect(mockGetFolderDocuments).toHaveBeenCalledWith(folderId);
    });

    await waitFor(() => {
      expect(result.current.loadingState.loading).toBe(false);
      expect(result.current.data.folder?.id).toBe(folderId);
      expect(result.current.data.documents).toHaveLength(2);
      expect(result.current.data.mainDoc?.id).toBe(1);
      expect(result.current.data.subDocs).toHaveLength(1);
      expect(result.current.data.subDocs[0].id).toBe(2);
    });
  });

  it("prevents transferring main document and shows toast", async () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.folder).not.toBeNull());
    await waitFor(() => expect(result.current.data.mainDoc).not.toBeNull());

    result.current.actions.openTransferDocs([1]);
    await waitFor(() => expect(result.current.modals.transferModalOpen).toBe(true));

    await result.current.actions.handleTransferConfirm(99);

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Main document"));
    expect(mockBatchMoveDocumentsToFolder).not.toHaveBeenCalled();
  });

  it("calls batchMoveDocumentsToFolder and refreshes when transferring sub-documents", async () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.subDocs.length).toBe(1));
    result.current.actions.openTransferDocs([2]);
    await waitFor(() => expect(result.current.modals.transferModalOpen).toBe(true));

    await result.current.actions.handleTransferConfirm(99);

    expect(mockBatchMoveDocumentsToFolder).toHaveBeenCalledWith([2], 99);
    await waitFor(() => expect(mockGetFolderDocuments).toHaveBeenCalledTimes(2));
  });

  it("calls batchMoveDocumentsToFolder and refreshes when transferring attachments", async () => {
    mockListAttachments.mockResolvedValue({
      success: true,
      data: [{ id: 10, name: "A1", file_name: "a1.pdf" }, { id: 11, name: "A2", file_name: "a2.pdf" }],
    });

    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.attachmentsDocId).toBe(1));
    result.current.actions.openTransferAttachments([10, 11]);
    await waitFor(() => expect(result.current.modals.transferModalOpen).toBe(true));

    await result.current.actions.handleTransferConfirm(99);

    expect(mockBatchMoveDocumentsToFolder).toHaveBeenCalledWith([10, 11], 99);
    await waitFor(() => expect(mockGetFolderDocuments).toHaveBeenCalledTimes(2));
  });

  it("calls deleteFolder and shows success toast on confirmDeleteFolder", async () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.folder).not.toBeNull());

    await result.current.actions.confirmDeleteFolder();

    expect(mockDeleteFolder).toHaveBeenCalledWith(folderId);
    expect(toast.success).toHaveBeenCalled();
  });

  it("calls createNote and refreshNotes when saving a new note", async () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.folder).not.toBeNull());

    result.current.actions.handleCreateNote();
    await waitFor(() => expect(result.current.modals.isNotesEditorOpen).toBe(true));

    await result.current.actions.handleSaveNote({ content: "New note", title: "Title" });

    expect(mockCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({
        folder_id: folderId,
        content: "New note",
        title: "Title",
      })
    );
    expect(mockListNotes).toHaveBeenCalled();
  });

  it("calls updateNote and refreshNotes when saving an existing note", async () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.folder).not.toBeNull());

    const existingNote = makeNoteListItem({ id: 10, content: "Old", title: "Old" });
    result.current.actions.handleEditNote(existingNote);
    await waitFor(() => expect(result.current.modals.isNotesEditorOpen).toBe(true));

    await result.current.actions.handleSaveNote({ content: "Updated", title: "New Title" });

    expect(mockUpdateNote).toHaveBeenCalledWith(10, expect.objectContaining({ content: "Updated", title: "New Title" }));
    expect(mockListNotes).toHaveBeenCalled();
  });

  it("calls deleteNote and refreshNotes when confirmDeleteNote is called", async () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.folder).not.toBeNull());

    await result.current.actions.confirmDeleteNote(10);

    expect(mockDeleteNote).toHaveBeenCalledWith(10);
    expect(mockListNotes).toHaveBeenCalled();
  });
});
