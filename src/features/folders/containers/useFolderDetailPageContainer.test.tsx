import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
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
const mockUpdateAttachment = vi.fn();
const mockDeleteAttachment = vi.fn();
const mockTrashDocument = vi.fn();
const mockGetDocument = vi.fn();
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
    getDocument: (...args: unknown[]) => mockGetDocument(...args),
    batchMoveDocumentsToFolder: (...args: unknown[]) => mockBatchMoveDocumentsToFolder(...args),
    listAttachments: (...args: unknown[]) => mockListAttachments(...args),
    downloadDocument: vi.fn().mockResolvedValue(new Blob()),
    deleteAttachment: (...args: unknown[]) => mockDeleteAttachment(...args),
    updateAttachment: (...args: unknown[]) => mockUpdateAttachment(...args),
    trashDocument: (...args: unknown[]) => mockTrashDocument(...args),
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
  const mainDoc = makeDocument({ id: 1, department_id: 10, upload_date: "2024-01-01T00:00:00Z", folder_role: "main" });
  const subDoc = makeDocument({ id: 2, department_id: 10, upload_date: "2024-01-02T00:00:00Z", folder_role: "sub" });

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
    mockUpdateAttachment.mockResolvedValue({ success: true });
    mockDeleteAttachment.mockResolvedValue({ success: true });
    mockTrashDocument.mockResolvedValue(undefined);
    mockGetDocument.mockResolvedValue({ success: true, data: {} });
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

  it("exposes attachment panel state: isAttachmentPanelOpen false initially, editAttachmentId null", async () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.folder).not.toBeNull());

    expect(result.current.modals.isAttachmentPanelOpen).toBe(false);
    expect(result.current.modals.editAttachmentId).toBeNull();
  });

  it("handleOpenEditAttachment opens attachment panel and sets edit state", async () => {
    mockListAttachments.mockResolvedValue({
      success: true,
      data: [{ id: 20, name: "Att1", file_name: "att1.pdf", description: "Desc" }],
    });

    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.attachmentsDocId).toBe(1));
    await waitFor(() => expect(result.current.data.attachments).toHaveLength(1));

    result.current.actions.handleOpenEditAttachment(20);

    await waitFor(() => expect(result.current.modals.isAttachmentPanelOpen).toBe(true));
    expect(result.current.modals.editAttachmentId).toBe(20);
    expect(result.current.modals.editAttachmentName).toBe("Att1");
    expect(result.current.modals.editAttachmentDescription).toBe("Desc");
  });

  it("openAddAttachmentPanel opens attachment panel and clears edit state", async () => {
    mockListAttachments.mockResolvedValue({
      success: true,
      data: [{ id: 20, name: "Att1", file_name: "att1.pdf" }],
    });

    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.attachments).toHaveLength(1));
    result.current.actions.handleOpenEditAttachment(20);
    await waitFor(() => expect(result.current.modals.editAttachmentId).toBe(20));

    result.current.actions.openAddAttachmentPanel();

    await waitFor(() => expect(result.current.modals.isAttachmentPanelOpen).toBe(true));
    await waitFor(() => expect(result.current.modals.editAttachmentId).toBeNull());
  });

  it("handleCloseAttachmentPanel closes attachment panel", async () => {
    mockListAttachments.mockResolvedValue({
      success: true,
      data: [{ id: 20, name: "Att1", file_name: "att1.pdf" }],
    });

    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.attachments).toHaveLength(1));
    result.current.actions.handleOpenEditAttachment(20);
    await waitFor(() => expect(result.current.modals.isAttachmentPanelOpen).toBe(true));

    result.current.actions.handleCloseAttachmentPanel();

    await waitFor(() => expect(result.current.modals.isAttachmentPanelOpen).toBe(false));
    expect(result.current.modals.editAttachmentId).toBeNull();
  });

  it("handleConfirmEditAttachment calls updateAttachment with name/description and closes panel on success", async () => {
    mockListAttachments.mockResolvedValue({
      success: true,
      data: [{ id: 20, name: "Att1", file_name: "att1.pdf", description: "Old" }],
    });

    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.attachments).toHaveLength(1));
    result.current.actions.handleOpenEditAttachment(20);
    result.current.actions.setEditAttachmentName("Updated name");
    result.current.actions.setEditAttachmentDescription("Updated desc");
    await waitFor(() => expect(result.current.modals.editAttachmentId).toBe(20));

    await result.current.actions.handleConfirmEditAttachment();

    expect(mockUpdateAttachment).toHaveBeenCalledWith(1, 20, {
      name: "Updated name",
      description: "Updated desc",
    });
    await waitFor(() => expect(result.current.modals.isAttachmentPanelOpen).toBe(false));
    expect(result.current.modals.editAttachmentId).toBeNull();
  });

  it("calls trashDocument and refreshes when confirmSubDocTrash is called (single sub-doc trash)", async () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.subDocs).toHaveLength(1));
    mockGetFolderDocuments.mockClear();

    await result.current.actions.confirmSubDocTrash(2);

    expect(mockTrashDocument).toHaveBeenCalledWith([2], undefined);
    await waitFor(() => expect(mockGetFolderDocuments).toHaveBeenCalled());
  });

  it("calls trashDocument for selected sub-docs and refreshes on confirmBatchSubDocTrash", async () => {
    const subDoc2 = makeDocument({ id: 2, department_id: 10, folder_role: "sub" });
    const subDoc3 = makeDocument({ id: 3, department_id: 10, folder_role: "other" });
    mockGetFolderDocuments.mockResolvedValue({ folder, data: [mainDoc, subDoc2, subDoc3] });

    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.subDocs).toHaveLength(2));
    expect(result.current.selection.subDocsSelectionConfig).not.toBeNull();
    result.current.selection.subDocsSelectionConfig!.onToggleAll();
    await waitFor(() => expect(result.current.selection.subDocSelectedIds.length).toBe(2));
    mockGetFolderDocuments.mockClear();

    await result.current.actions.confirmBatchSubDocTrash();

    expect(mockTrashDocument).toHaveBeenCalledWith([2, 3], undefined);
    await waitFor(() => expect(mockGetFolderDocuments).toHaveBeenCalled());
  });

  it("calls deleteAttachment and refreshes when confirmAttachmentTrash is called (single attachment trash)", async () => {
    mockListAttachments.mockResolvedValue({
      success: true,
      data: [{ id: 10, name: "A1", file_name: "a1.pdf" }],
    });

    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.attachmentsDocId).toBe(1));
    await waitFor(() => expect(result.current.data.attachments).toHaveLength(1));
    mockGetFolderDocuments.mockClear();
    mockListAttachments.mockClear();

    await result.current.actions.confirmAttachmentTrash(10);

    expect(mockDeleteAttachment).toHaveBeenCalledWith(1, 10);
    await waitFor(() => expect(mockListAttachments).toHaveBeenCalled());
  });

  it("calls deleteAttachment for selected attachments on confirmBatchAttachmentTrash", async () => {
    mockListAttachments.mockResolvedValue({
      success: true,
      data: [
        { id: 10, name: "A1", file_name: "a1.pdf" },
        { id: 11, name: "A2", file_name: "a2.pdf" },
      ],
    });

    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.attachmentsDocId).toBe(1));
    await waitFor(() => expect(result.current.data.attachments).toHaveLength(2));
    expect(result.current.selection.attachmentsSelectionConfig).not.toBeNull();
    result.current.selection.attachmentsSelectionConfig!.onToggleAll();
    await waitFor(() => expect(result.current.selection.attachmentSelectedIds.length).toBe(2));
    mockListAttachments.mockClear();

    await result.current.actions.confirmBatchAttachmentTrash();

    expect(mockDeleteAttachment).toHaveBeenCalledWith(1, 10);
    expect(mockDeleteAttachment).toHaveBeenCalledWith(1, 11);
    await waitFor(() => expect(mockListAttachments).toHaveBeenCalled());
  });

  it("opens upload panel for sub-document when handleUploadInFolder is called (folder has docs)", async () => {
    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.folder).not.toBeNull());

    result.current.actions.handleUploadInFolder();

    await waitFor(() => expect(result.current.modals.isUploadOpen).toBe(true));
    expect(result.current.modals.uploadPanelInitialValues.upload_kind).toBe("sub");
    expect(result.current.modals.uploadPanelInitialValues.folder_id).toBe(folderId);
  });

  it("opens upload panel for attachment when handleAddAttachment is called with attachmentsDocId set", async () => {
    mockListAttachments.mockResolvedValue({
      success: true,
      data: [{ id: 10, name: "A1", file_name: "a1.pdf" }],
    });

    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.attachmentsDocId).toBe(1));
    await waitFor(() => expect(result.current.data.attachments).toHaveLength(1));

    result.current.actions.handleAddAttachment();

    await waitFor(() => expect(result.current.modals.isUploadOpen).toBe(true));
    expect(result.current.modals.uploadPanelInitialValues.upload_kind).toBe("attachment");
    expect(result.current.modals.uploadPanelInitialValues.target_document_id).toBe(1);
  });

  it("calls batchMoveDocumentsToFolder for multiple sub-docs and refreshes on batch transfer", async () => {
    const subDoc2 = makeDocument({ id: 2, department_id: 10, folder_role: "sub" });
    const subDoc3 = makeDocument({ id: 3, department_id: 10, folder_role: "other" });
    mockGetFolderDocuments.mockResolvedValue({ folder, data: [mainDoc, subDoc2, subDoc3] });

    const { result } = renderHookWithProviders(() => useFolderDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.subDocs).toHaveLength(2));
    result.current.actions.openTransferDocs([2, 3]);
    await waitFor(() => expect(result.current.modals.transferModalOpen).toBe(true));

    await result.current.actions.handleTransferConfirm(99);

    expect(mockBatchMoveDocumentsToFolder).toHaveBeenCalledWith([2, 3], 99);
    await waitFor(() => expect(mockGetFolderDocuments).toHaveBeenCalledTimes(2));
  });
});
