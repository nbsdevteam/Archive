/**
 * Tests for useArchivedDocumentsPageContainer: archived list fetch, batch unarchive/trash,
 * batchActions visibility, and no-op when no selection.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../../app/providers/AppProviders";
import { resetStores } from "../../../test/testUtils/resetStores";
import { makeDocument } from "../../../test/fixtures/documents";
import { useArchivedDocumentsPageContainer } from "./useArchivedDocumentsPageContainer";

const mockGetDocuments = vi.fn();
const mockUnarchiveDocument = vi.fn();
const mockTrashDocument = vi.fn();
const mockBatchMoveDocumentsToFolder = vi.fn();
const mockDownloadBlobAsFile = vi.fn();

vi.mock("../../../app/adapter/api/documents.api", () => ({
  documentsApi: {
    getDocuments: (...args: unknown[]) => mockGetDocuments(...args),
    unarchiveDocument: (...args: unknown[]) => mockUnarchiveDocument(...args),
    trashDocument: (...args: unknown[]) => mockTrashDocument(...args),
    batchMoveDocumentsToFolder: (...args: unknown[]) => mockBatchMoveDocumentsToFolder(...args),
    downloadDocument: vi.fn().mockResolvedValue(new Blob()),
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

const defaultArchivedResponse = {
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

describe("useArchivedDocumentsPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockGetDocuments.mockResolvedValue(defaultArchivedResponse);
    mockUnarchiveDocument.mockResolvedValue({ success: true });
    mockTrashDocument.mockResolvedValue({ success: true });
    mockBatchMoveDocumentsToFolder.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    resetStores();
  });

  it("fetches archived documents on mount and exposes data", async () => {
    const doc = makeDocument({ id: 10, title: "Archived Doc", status: "archived" });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc],
      pagination: { total: 1, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useArchivedDocumentsPageContainer(), { wrapper });

    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    await waitFor(() => expect(result.current.data.documents).toHaveLength(1));
    expect(result.current.data.documents[0].title).toBe("Archived Doc");
  });

  it("batchActions when two archived sub-docs selected: canBatchUnarchive and canBatchTrash true", async () => {
    const doc1 = makeDocument({ id: 1, status: "archived", is_main_document: false });
    const doc2 = makeDocument({ id: 2, status: "archived", is_main_document: false });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useArchivedDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));

    expect(result.current.selection.batchActions.canBatchUnarchive).toBe(true);
    expect(result.current.selection.batchActions.canBatchTrash).toBe(true);
    expect(result.current.selection.batchActions.canBatchRestore).toBe(false);
    expect(result.current.selection.batchActions.canBatchArchive).toBe(false);
    expect(result.current.selection.batchActions.canBatchTransfer).toBe(false);
  });

  it("calls unarchiveDocument for selected ids and refetches on confirmBatchUnarchive", async () => {
    const doc1 = makeDocument({ id: 1, status: "archived", is_main_document: false });
    const doc2 = makeDocument({ id: 2, status: "archived", is_main_document: false });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useArchivedDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));
    mockGetDocuments.mockClear();

    await result.current.actions.confirmBatchUnarchive();

    expect(mockUnarchiveDocument).toHaveBeenCalledWith(expect.arrayContaining([1, 2]));
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(0));
  });

  it("calls trashDocument for selected ids and refetches on confirmBatchTrash", async () => {
    const doc1 = makeDocument({ id: 1, status: "archived", is_main_document: false });
    const doc2 = makeDocument({ id: 2, status: "archived", is_main_document: false });
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useArchivedDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));
    mockGetDocuments.mockClear();

    await result.current.actions.confirmBatchTrash();

    expect(mockTrashDocument).toHaveBeenCalledWith([1, 2], undefined);
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(0));
  });

  it("does not call unarchive or trash when confirmBatchUnarchive with no selection", async () => {
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [makeDocument({ id: 1, status: "archived" })],
      pagination: { total: 1, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useArchivedDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(1));

    await result.current.actions.confirmBatchUnarchive();

    expect(mockUnarchiveDocument).not.toHaveBeenCalled();
  });

  it("does not call trash when confirmBatchTrash with no selection", async () => {
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [makeDocument({ id: 1, status: "archived" })],
      pagination: { total: 1, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useArchivedDocumentsPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(1));

    await result.current.actions.confirmBatchTrash();

    expect(mockTrashDocument).not.toHaveBeenCalled();
  });
});
