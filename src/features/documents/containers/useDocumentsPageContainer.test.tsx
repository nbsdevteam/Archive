import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { toast } from "react-toastify";
import { AppProviders } from "../../../app/providers/AppProviders";
import { resetStores } from "../../../test/testUtils/resetStores";
import { makeDocument } from "../../../test/fixtures/documents";
import { useDocumentsPageContainer } from "./useDocumentsPageContainer";

const mockGetDocuments = vi.fn();
const mockDownloadDocument = vi.fn();
const mockArchiveDocument = vi.fn();
const mockTrashDocument = vi.fn();
const mockBatchMoveDocumentsToFolder = vi.fn();
const mockDownloadBlobAsFile = vi.fn();

vi.mock("../../../app/adapter/api/documents.api", () => ({
  documentsApi: {
    getDocuments: (...args: unknown[]) => mockGetDocuments(...args),
    downloadDocument: (...args: unknown[]) => mockDownloadDocument(...args),
    archiveDocument: (...args: unknown[]) => mockArchiveDocument(...args),
    trashDocument: (...args: unknown[]) => mockTrashDocument(...args),
    batchMoveDocumentsToFolder: (...args: unknown[]) => mockBatchMoveDocumentsToFolder(...args),
  },
}));

vi.mock("../../../app/adapter/api/admin.api", () => ({
  adminApi: {
    getDepartments: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getDocumentTypes: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

vi.mock("../../../shared/utils/files/downloadBlobAsFile", () => ({
  downloadBlobAsFile: (...args: unknown[]) => mockDownloadBlobAsFile(...args),
}));

const defaultDocumentsResponse = {
  success: true,
  data: [],
  pagination: { total: 0, page: 1, per_page: 20, total_pages: 0 },
};

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <AppProviders>{children}</AppProviders>
    </MemoryRouter>
  );
}

describe("useDocumentsPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockGetDocuments.mockResolvedValue(defaultDocumentsResponse);
    mockDownloadDocument.mockResolvedValue(new Blob());
    mockArchiveDocument.mockResolvedValue({ success: true });
    mockTrashDocument.mockResolvedValue({ success: true });
    mockBatchMoveDocumentsToFolder.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    resetStores();
  });

  it("calls documentsApi.downloadDocument and downloadBlobAsFile when handleDownloadDocument is called", async () => {
    const doc = makeDocument({ id: 1, file_name: "test.pdf" });
    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });

    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());

    await result.current.actions.handleDownloadDocument(doc);

    expect(mockDownloadDocument).toHaveBeenCalledWith(1);
    expect(mockDownloadBlobAsFile).toHaveBeenCalledWith(expect.any(Blob), "test.pdf");
  });

  it("calls archiveDocument and refresh when confirmArchive is called", async () => {
    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    mockGetDocuments.mockClear();

    await result.current.actions.confirmArchive(1);

    expect(mockArchiveDocument).toHaveBeenCalledWith(expect.arrayContaining([1]));
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
  });

  it("calls trashDocument and refresh when confirmTrash is called", async () => {
    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    mockGetDocuments.mockClear();

    await result.current.actions.confirmTrash(1);

    expect(mockTrashDocument).toHaveBeenCalledWith([1], undefined);
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
  });

  it("shows toast.error when transfer is opened with mixed-department selection", async () => {
    const doc1 = makeDocument({ id: 1, department_id: 10 });
    const doc2 = makeDocument({ id: 2, department_id: 20 });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));

    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));

    result.current.actions.handleOpenBatchMoveConfirm();

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("same department")
    );
    expect(mockBatchMoveDocumentsToFolder).not.toHaveBeenCalled();
  });

  it("calls trashDocument for multiple ids and refresh when confirmBatchTrash is called", async () => {
    const doc1 = makeDocument({ id: 1, department_id: 10 });
    const doc2 = makeDocument({ id: 2, department_id: 10 });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));
    mockGetDocuments.mockClear();

    await result.current.actions.confirmBatchTrash();

    expect(mockTrashDocument).toHaveBeenCalledWith([1, 2], undefined);
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
  });

  it("calls batchMoveDocumentsToFolder when handleConfirmBatchMove is called with same-department docs", async () => {
    const doc1 = makeDocument({ id: 1, department_id: 10 });
    const doc2 = makeDocument({ id: 2, department_id: 10 });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));

    result.current.actions.handleOpenSingleMoveConfirm(1);
    await waitFor(() => expect(result.current.modals.isMoveModalOpen).toBe(true));

    await result.current.actions.handleConfirmBatchMove(99);

    expect(mockBatchMoveDocumentsToFolder).toHaveBeenCalledWith([1], 99);
  });

  it("exposes edit panel state: editDocumentId is null initially, set by handleOpenEdit, cleared by handleCloseEdit", async () => {
    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());

    expect(result.current.modals.editDocumentId).toBeNull();

    result.current.actions.handleOpenEdit(5);
    await waitFor(() => expect(result.current.modals.editDocumentId).toBe(5));

    result.current.actions.handleCloseEdit();
    await waitFor(() => expect(result.current.modals.editDocumentId).toBeNull());
  });

  it("handleEditSuccess clears editDocumentId and refetches documents", async () => {
    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    mockGetDocuments.mockClear();

    result.current.actions.handleOpenEdit(3);
    await waitFor(() => expect(result.current.modals.editDocumentId).toBe(3));

    result.current.actions.handleEditSuccess();
    await waitFor(() => expect(result.current.modals.editDocumentId).toBeNull());
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
  });

  it("calls batchMoveDocumentsToFolder for multiple selected docs and refetches on batch transfer", async () => {
    const doc1 = makeDocument({ id: 1, department_id: 10 });
    const doc2 = makeDocument({ id: 2, department_id: 10 });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));

    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));

    result.current.actions.handleOpenBatchMoveConfirm();
    await waitFor(() => expect(result.current.modals.isMoveModalOpen).toBe(true));

    mockGetDocuments.mockClear();
    await result.current.actions.handleConfirmBatchMove(99);

    expect(mockBatchMoveDocumentsToFolder).toHaveBeenCalledWith([1, 2], 99);
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    await waitFor(() => expect(result.current.modals.isMoveModalOpen).toBe(false));
  });

  it("opens upload panel on handleOpenUpload and refetches on handleUploadSuccess", async () => {
    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());

    expect(result.current.modals.isUploadOpen).toBe(false);
    result.current.actions.handleOpenUpload();
    await waitFor(() => expect(result.current.modals.isUploadOpen).toBe(true));

    mockGetDocuments.mockClear();
    result.current.actions.handleUploadSuccess();
    await waitFor(() => expect(result.current.modals.isUploadOpen).toBe(false));
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
  });

  it("calls archiveDocument for selected ids and refetches on confirmBatchArchive", async () => {
    const doc1 = makeDocument({ id: 1, department_id: 10, status: "active" });
    const doc2 = makeDocument({ id: 2, department_id: 10, status: "active" });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));
    mockGetDocuments.mockClear();

    await result.current.actions.confirmBatchArchive();

    expect(mockArchiveDocument).toHaveBeenCalledWith(expect.arrayContaining([1, 2]));
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(0));
  });

  it("batchActions for all-active sub-docs: canBatchTransfer, canBatchArchive, canBatchTrash true", async () => {
    const doc1 = makeDocument({ id: 1, status: "active", is_main_document: false });
    const doc2 = makeDocument({ id: 2, status: "active", is_main_document: false });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));

    expect(result.current.selection.batchActions.canBatchTransfer).toBe(true);
    expect(result.current.selection.batchActions.canBatchArchive).toBe(true);
    expect(result.current.selection.batchActions.canBatchTrash).toBe(true);
    expect(result.current.selection.batchActions.canBatchRestore).toBe(false);
    expect(result.current.selection.batchActions.canBatchUnarchive).toBe(false);
  });

  it("batchActions for mixed status (active + archived): only canBatchTrash true", async () => {
    const doc1 = makeDocument({ id: 1, status: "active", is_main_document: false });
    const doc2 = makeDocument({ id: 2, status: "archived", is_main_document: false });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));

    expect(result.current.selection.batchActions.canBatchTransfer).toBe(false);
    expect(result.current.selection.batchActions.canBatchArchive).toBe(false);
    expect(result.current.selection.batchActions.canBatchTrash).toBe(true);
    expect(result.current.selection.batchActions.canBatchRestore).toBe(false);
    expect(result.current.selection.batchActions.canBatchUnarchive).toBe(false);
  });

  it("batchActions for mixed main + sub (active): only canBatchArchive true", async () => {
    const mainDoc = makeDocument({ id: 1, status: "active", is_main_document: true });
    const subDoc = makeDocument({ id: 2, status: "active", is_main_document: false });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [mainDoc, subDoc],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));

    expect(result.current.selection.batchActions.canBatchArchive).toBe(true);
    expect(result.current.selection.batchActions.canBatchTransfer).toBe(false);
    expect(result.current.selection.batchActions.canBatchTrash).toBe(false);
  });

  it("handleBatchTrashClick with main doc in selection opens main-files block modal and does not open trash dialog", async () => {
    const mainDoc = makeDocument({ id: 1, status: "active", is_main_document: true, title: "Main File" });
    const subDoc = makeDocument({ id: 2, status: "active", is_main_document: false });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [mainDoc, subDoc],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));

    const mockOpenBatchTrashDialog = vi.fn();
    result.current.actions.handleBatchTrashClick(mockOpenBatchTrashDialog);

    await waitFor(() => expect(result.current.modals.mainFilesBlockModal.isOpen).toBe(true));
    expect(result.current.modals.mainFilesBlockModal.mainFileNames).toContain("Main File");
    expect(mockOpenBatchTrashDialog).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds).not.toContain(1));
  });

  it("handleBatchTrashClick with only sub-docs selected opens trash dialog", async () => {
    const mainDoc = makeDocument({ id: 1, status: "active", is_main_document: true });
    const subDoc = makeDocument({ id: 2, status: "active", is_main_document: false });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [mainDoc, subDoc],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggle(2);
    await waitFor(() => expect(result.current.selection.selectedDocumentIds).toContain(2));

    const mockOpenBatchTrashDialog = vi.fn();
    result.current.actions.handleBatchTrashClick(mockOpenBatchTrashDialog);

    expect(mockOpenBatchTrashDialog).toHaveBeenCalled();
  });
});
