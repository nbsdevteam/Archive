/**
 * The document lists are cached in React Query, so every write here must invalidate them or the
 * user would see removed rows until the cache went stale.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { queryClient } from "../../../shared/lib/queryClient";
import { queryKeys } from "../../../shared/lib/queryKeys";
import { useDocumentStore } from "./documentStore";

const mockApi = vi.hoisted(() => ({
  archiveDocument: vi.fn(),
  unarchiveDocument: vi.fn(),
  trashDocument: vi.fn(),
  restoreDocument: vi.fn(),
  permanentDeleteDocuments: vi.fn(),
  uploadDocument: vi.fn(),
  getDocument: vi.fn(),
}));

vi.mock("../../../app/adapter/api/documents.api", () => ({ documentsApi: mockApi }));

const listKey = queryKeys.documents.list({ status: "active" });

describe("documentStore write actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockApi).forEach((fn) => fn.mockResolvedValue({ success: true, data: { id: 1 } }));
    queryClient.setQueryData(listKey, { pages: [], pageParams: [] });
  });

  const isListStale = () => queryClient.getQueryState(listKey)?.isInvalidated;

  it.each([
    ["archiveDocument", () => useDocumentStore.getState().archiveDocument(1)],
    ["unarchiveDocument", () => useDocumentStore.getState().unarchiveDocument(1)],
    ["trashDocument", () => useDocumentStore.getState().trashDocument(1)],
    ["permanentDeleteDocuments", () => useDocumentStore.getState().permanentDeleteDocuments([1])],
  ])("%s invalidates cached lists", async (_name, action) => {
    expect(isListStale()).toBe(false);

    await action();

    expect(isListStale()).toBe(true);
  });

  it("restoreDocument invalidates only when something was restored", async () => {
    mockApi.restoreDocument.mockResolvedValue({ restored: [], failed: [1] });
    await useDocumentStore.getState().restoreDocument(1);
    expect(isListStale()).toBe(false);

    mockApi.restoreDocument.mockResolvedValue({ restored: [1], failed: [] });
    await useDocumentStore.getState().restoreDocument(1);
    expect(isListStale()).toBe(true);
  });

  it("does not invalidate when the write fails", async () => {
    mockApi.trashDocument.mockRejectedValue(new Error("nope"));

    await expect(useDocumentStore.getState().trashDocument(1)).rejects.toThrow("nope");

    expect(isListStale()).toBe(false);
  });
});
