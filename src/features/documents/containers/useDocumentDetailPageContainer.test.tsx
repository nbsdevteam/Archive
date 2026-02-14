import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "../../../test/testUtils/renderWithProviders";
import { resetStores } from "../../../test/testUtils/resetStores";
import { makeDocument } from "../../../test/fixtures/documents";
import { useDocumentDetailPageContainer } from "./useDocumentDetailPageContainer";

const docId = 99;
const initialEntries = [`/documents/${docId}`];
const routePath = "/documents/:id";

const mockGetDocument = vi.fn();
const mockListAttachments = vi.fn();
const mockGetRelations = vi.fn();
const mockGetManagers = vi.fn();
const mockDownloadDocumentWithToast = vi.fn();
const mockListNotes = vi.fn();
const mockCreateNote = vi.fn();
const mockUpdateNote = vi.fn();
const mockDeleteNote = vi.fn();

vi.mock("../../../app/adapter/api/documents.api", () => ({
  documentsApi: {
    getDocument: (...args: unknown[]) => mockGetDocument(...args),
    listAttachments: (...args: unknown[]) => mockListAttachments(...args),
    getRelations: (...args: unknown[]) => mockGetRelations(...args),
    addRelation: vi.fn().mockResolvedValue({ success: true }),
    setParent: vi.fn().mockResolvedValue({ success: true }),
    downloadDocument: vi.fn().mockResolvedValue(new Blob()),
  },
}));

vi.mock("../../../app/adapter/api/admin.api", () => ({
  adminApi: {
    getManagers: (...args: unknown[]) => mockGetManagers(...args),
  },
}));

vi.mock("../../../shared/utils/documents/downloadDocumentWithToast", () => ({
  downloadDocumentWithToast: (...args: unknown[]) => mockDownloadDocumentWithToast(...args),
}));

vi.mock("../../activity/hooks/useAuditLogs", () => ({
  useAuditLogs: () => ({
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
  useSignatureStore: () => ({
    requests: [],
    fetchRequests: vi.fn(),
    createRequest: vi.fn(),
    uploadSigned: vi.fn(),
  }),
}));

vi.mock("../../../app/adapter/api/ocr.api", () => ({
  ocrApi: { runOcr: vi.fn().mockResolvedValue({ success: true }) },
}));

function makeDocumentDetail(overrides: Record<string, unknown> = {}) {
  const doc = makeDocument({ id: docId, file_name: "detail-test.pdf", ...overrides });
  return {
    ...doc,
    is_locked: false,
    tags: [],
    versions: [{ id: 1, version_number: 1, file_name: "detail-test.pdf", file_size: 100, uploaded_by: "u", upload_date: "2024-01-01", change_description: "" }],
    ocr: {},
    ocr_status: "pending",
  };
}

describe("useDocumentDetailPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockGetDocument.mockResolvedValue({ success: true, data: makeDocumentDetail() });
    mockListAttachments.mockResolvedValue({ success: true, data: [] });
    mockGetRelations.mockResolvedValue({ success: true, data: {} });
    mockGetManagers.mockResolvedValue({ success: true, data: [] });
    mockListNotes.mockResolvedValue({ success: true, data: [] });
    mockCreateNote.mockResolvedValue({ success: true, data: { id: 1 } });
    mockUpdateNote.mockResolvedValue({ success: true });
    mockDeleteNote.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    resetStores();
  });

  it("fetches document on mount when docId is set", async () => {
    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());

    expect(mockGetDocument).toHaveBeenCalledWith(docId);
    expect(result.current.data.docId).toBe(docId);
    expect(result.current.data.fileName).toBe("detail-test.pdf");
  });

  it("handleDownloadCurrent calls downloadDocumentWithToast with doc id and fileName", async () => {
    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());

    await result.current.actions.handleDownloadCurrent();

    expect(mockDownloadDocumentWithToast).toHaveBeenCalledWith(
      docId,
      "detail-test.pdf",
      expect.any(Function)
    );
  });

  it("confirmDeleteNote wires to note editor and calls deleteNote then refresh", async () => {
    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());

    await result.current.actions.confirmDeleteNote(10);

    expect(mockDeleteNote).toHaveBeenCalledWith(10);
  });

  it("exposes edit panel state: editDocumentId null initially, set by handleOpenEdit, cleared by handleEditSuccess with refetch", async () => {
    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());

    expect(result.current.modals.editDocumentId).toBeNull();

    result.current.actions.handleOpenEdit();
    await waitFor(() => expect(result.current.modals.editDocumentId).toBe(docId));

    mockGetDocument.mockClear();
    result.current.actions.handleEditSuccess();
    await waitFor(() => expect(result.current.modals.editDocumentId).toBeNull());
    await waitFor(() => expect(mockGetDocument).toHaveBeenCalledWith(docId));
  });
});
