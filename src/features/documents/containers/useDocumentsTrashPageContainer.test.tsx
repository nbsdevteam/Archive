/**
 * Tests for useDocumentsTrashPageContainer: trash list fetch, restore (single/batch),
 * selection, and error handling. No tests for permanent delete (production safety).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../../app/providers/AppProviders";
import { resetStores } from "../../../test/testUtils/resetStores";
import { makeDocument } from "../../../test/fixtures/documents";
import { useDocumentsTrashPageContainer } from "./useDocumentsTrashPageContainer";

const mockListTrashDocuments = vi.fn();
const mockRestoreDocument = vi.fn();
const mockPermanentDeleteSingle = vi.fn();
const mockPermanentDeleteBatch = vi.fn();

vi.mock("../../../app/adapter/api/documents.api", () => ({
  documentsApi: {
    listTrashDocuments: (...args: unknown[]) => mockListTrashDocuments(...args),
  },
}));

/** Mock that invokes onSuccess so container refetches (listTrashDocuments) after restore/delete. */
const wrapWithOnSuccess =
  (fn: (...args: unknown[]) => Promise<boolean>) =>
  async (...args: unknown[]) => {
    const options = args[1] as { onSuccess?: () => void | Promise<void> } | undefined;
    const ok = await fn(...args);
    if (ok && options?.onSuccess) await options.onSuccess();
    return ok;
  };
vi.mock("../../../shared/hooks/useDocumentOperations", () => ({
  useDocumentOperations: () => ({
    isRestoring: false,
    isPermanentDeleting: false,
    restoreDocument: wrapWithOnSuccess(mockRestoreDocument),
    permanentDeleteSingle: wrapWithOnSuccess(mockPermanentDeleteSingle),
    permanentDeleteBatch: wrapWithOnSuccess(mockPermanentDeleteBatch),
  }),
}));

vi.mock("../../auth/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { role: "admin", is_admin: true },
  }),
}));

const defaultTrashResponse = {
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

describe("useDocumentsTrashPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockListTrashDocuments.mockResolvedValue(defaultTrashResponse);
    mockRestoreDocument.mockResolvedValue(true);
    mockPermanentDeleteSingle.mockResolvedValue(true);
    mockPermanentDeleteBatch.mockResolvedValue(true);
  });

  afterEach(() => {
    resetStores();
  });

  it("fetches trash documents on mount and exposes data", async () => {
    const doc = makeDocument({ id: 10, title: "Trashed Doc" });
    mockListTrashDocuments.mockResolvedValue({
      data: [doc],
      pagination: { total: 1, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsTrashPageContainer(), { wrapper });

    await waitFor(() => expect(mockListTrashDocuments).toHaveBeenCalled());
    await waitFor(() => expect(result.current.data.documents).toHaveLength(1));
    expect(result.current.data.documents[0].title).toBe("Trashed Doc");
    expect(result.current.data.isAdmin).toBe(true);
  });

  it("calls restoreDocument and refetches when handleRestore is called", async () => {
    const { result } = renderHook(() => useDocumentsTrashPageContainer(), { wrapper });
    await waitFor(() => expect(mockListTrashDocuments).toHaveBeenCalled());
    mockListTrashDocuments.mockClear();

    await result.current.actions.handleRestore(5);

    expect(mockRestoreDocument).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    );
    await waitFor(() => expect(mockListTrashDocuments).toHaveBeenCalled(), { timeout: 2000 });
  });

  it("does not call restore when confirmBatchRestore with no selection", async () => {
    const { result } = renderHook(() => useDocumentsTrashPageContainer(), { wrapper });
    await waitFor(() => expect(mockListTrashDocuments).toHaveBeenCalled());

    await result.current.actions.confirmBatchRestore();

    expect(mockRestoreDocument).not.toHaveBeenCalled();
  });

  it("calls restoreDocument for selected ids and clears selection on confirmBatchRestore", async () => {
    const doc1 = makeDocument({ id: 1 });
    const doc2 = makeDocument({ id: 2 });
    mockListTrashDocuments.mockResolvedValue({
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsTrashPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));

    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));
    mockListTrashDocuments.mockClear();

    await result.current.actions.confirmBatchRestore();

    expect(mockRestoreDocument).toHaveBeenCalledWith(
      [1, 2],
      expect.objectContaining({
        onSuccess: expect.any(Function),
      })
    );
    await waitFor(() => expect(mockListTrashDocuments).toHaveBeenCalled(), { timeout: 2000 });
  });

  it("batchActions when two trashed docs selected: canBatchRestore true, others false", async () => {
    const doc1 = makeDocument({ id: 1, status: "trashed" });
    const doc2 = makeDocument({ id: 2, status: "trashed" });
    mockListTrashDocuments.mockResolvedValue({
      data: [doc1, doc2],
      pagination: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsTrashPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(2));
    result.current.selection.selectionConfig.onToggleAll();
    await waitFor(() => expect(result.current.selection.selectedDocumentIds.length).toBe(2));

    expect(result.current.selection.batchActions.canBatchRestore).toBe(true);
    expect(result.current.selection.batchActions.canBatchArchive).toBe(false);
    expect(result.current.selection.batchActions.canBatchUnarchive).toBe(false);
    expect(result.current.selection.batchActions.canBatchTransfer).toBe(false);
    expect(result.current.selection.batchActions.canBatchTrash).toBe(false);
  });

  it("batchActions when no selection: canBatchRestore false", async () => {
    mockListTrashDocuments.mockResolvedValue({
      data: [makeDocument({ id: 1, status: "trashed" })],
      pagination: { total: 1, page: 1, per_page: 20, total_pages: 1 },
    });

    const { result } = renderHook(() => useDocumentsTrashPageContainer(), { wrapper });
    await waitFor(() => expect(result.current.data.documents.length).toBe(1));

    expect(result.current.selection.batchActions.canBatchRestore).toBe(false);
  });

  it("sets error when listTrashDocuments fails", async () => {
    mockListTrashDocuments.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useDocumentsTrashPageContainer(), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data.documents).toHaveLength(0);
  });
});
