import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { toast } from "react-toastify";
import { AppProviders } from "../../../app/providers/AppProviders";
import { resetStores } from "../../../test/testUtils/resetStores";
import { makeDocument } from "../../../test/fixtures/documents";
import { useDocumentStore } from "../stores/documentStore";
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
});
