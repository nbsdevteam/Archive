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
const mockUpdateAttachment = vi.fn();
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
    updateAttachment: (...args: unknown[]) => mockUpdateAttachment(...args),
    downloadAttachment: vi.fn().mockResolvedValue(new Blob()),
    deleteAttachment: vi.fn().mockResolvedValue({ success: true }),
  },
  /** Mock so useDocumentDetailData does not call undefined (hook clears preview cache on load). */
  clearDocumentPreviewCache: vi.fn().mockResolvedValue(undefined),
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
    mockListAttachments.mockResolvedValue({
      success: true,
      data: [{ id: 10, name: "Att1", file_name: "att1.pdf", description: "D1" }],
    });
    mockGetRelations.mockResolvedValue({ success: true, data: {} });
    mockGetManagers.mockResolvedValue({ success: true, data: [] });
    mockListNotes.mockResolvedValue({ success: true, data: [] });
    mockCreateNote.mockResolvedValue({ success: true, data: { id: 1 } });
    mockUpdateNote.mockResolvedValue({ success: true });
    mockDeleteNote.mockResolvedValue({ success: true });
    mockUpdateAttachment.mockResolvedValue({ success: true });
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

  it("exposes attachment panel state: isAddAttachmentPanelOpen false initially, editAttachmentId null", async () => {
    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());

    expect(result.current.modals.isAddAttachmentPanelOpen).toBe(false);
    expect(result.current.modals.editAttachmentId).toBeNull();
  });

  it("handleOpenEditAttachment opens attachment panel and sets edit state for the attachment", async () => {
    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());
    result.current.tabState.setActiveTab("attachments");
    await waitFor(() => expect(result.current.data.attachments).toHaveLength(1));

    result.current.actions.handleOpenEditAttachment(10);

    await waitFor(() => expect(result.current.modals.isAddAttachmentPanelOpen).toBe(true));
    expect(result.current.modals.editAttachmentId).toBe(10);
    expect(result.current.modals.editAttachmentName).toBe("Att1");
    expect(result.current.modals.editAttachmentDescription).toBe("D1");
  });

  it("openAddAttachmentPanel opens attachment panel and clears edit state", async () => {
    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());
    result.current.tabState.setActiveTab("attachments");
    await waitFor(() => expect(result.current.data.attachments).toHaveLength(1));
    result.current.actions.handleOpenEditAttachment(10);
    await waitFor(() => expect(result.current.modals.editAttachmentId).toBe(10));

    result.current.actions.openAddAttachmentPanel();

    await waitFor(() => expect(result.current.modals.isAddAttachmentPanelOpen).toBe(true));
    await waitFor(() => expect(result.current.modals.editAttachmentId).toBeNull());
  });

  it("handleCloseAttachmentPanel closes attachment panel and clears edit state", async () => {
    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());
    result.current.tabState.setActiveTab("attachments");
    await waitFor(() => expect(result.current.data.attachments).toHaveLength(1));
    result.current.actions.handleOpenEditAttachment(10);
    await waitFor(() => expect(result.current.modals.isAddAttachmentPanelOpen).toBe(true));

    result.current.actions.handleCloseAttachmentPanel();

    await waitFor(() => expect(result.current.modals.isAddAttachmentPanelOpen).toBe(false));
    expect(result.current.modals.editAttachmentId).toBeNull();
  });

  it("handleConfirmEditAttachment calls updateAttachment and closes panel on success", async () => {
    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());
    result.current.tabState.setActiveTab("attachments");
    await waitFor(() => expect(result.current.data.attachments).toHaveLength(1));
    result.current.actions.handleOpenEditAttachment(10);
    result.current.actions.setEditAttachmentName("Updated");
    result.current.actions.setEditAttachmentDescription("New desc");
    await waitFor(() => expect(result.current.modals.editAttachmentId).toBe(10));

    await result.current.actions.handleConfirmEditAttachment();

    expect(mockUpdateAttachment).toHaveBeenCalledWith(docId, 10, {
      name: "Updated",
      description: "New desc",
    });
    await waitFor(() => expect(result.current.modals.isAddAttachmentPanelOpen).toBe(false));
    expect(result.current.modals.editAttachmentId).toBeNull();
  });

  it("exposes latestVersionId and fileName from newest version when document has multiple versions", async () => {
    const base = makeDocumentDetail();
    const twoVersions = [
      { id: 2, version_number: 2, file_name: "new-version.pdf", file_size: 200, uploaded_by: "u2", upload_date: "2024-06-01", change_description: "Updated" },
      { id: 1, version_number: 1, file_name: "detail-test.pdf", file_size: 100, uploaded_by: "u", upload_date: "2024-01-01", change_description: "" },
    ];
    const docWithTwoVersions = { ...base, versions: twoVersions, file_name: "new-version.pdf" };
    mockGetDocument.mockResolvedValue({ success: true, data: docWithTwoVersions });

    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());

    expect(result.current.data.latestVersionId).toBe(2);
    expect(result.current.data.fileName).toBe("new-version.pdf");
    expect(result.current.data.versions).toHaveLength(2);
  });

  it("after refetch with updated versions, data.latestVersionId and fileName reflect latest so preview shows new version", async () => {
    const docWithOneVersion = makeDocumentDetail();
    const base = makeDocumentDetail();
    const twoVersions = [
      { id: 2, version_number: 2, file_name: "uploaded-latest.pdf", file_size: 300, uploaded_by: "u2", upload_date: "2024-06-15", change_description: "New version" },
      { id: 1, version_number: 1, file_name: "detail-test.pdf", file_size: 100, uploaded_by: "u", upload_date: "2024-01-01", change_description: "" },
    ];
    const docWithTwoVersions = { ...base, versions: twoVersions, file_name: "uploaded-latest.pdf" };
    mockGetDocument.mockResolvedValueOnce({ success: true, data: docWithOneVersion }).mockResolvedValue({ success: true, data: docWithTwoVersions });

    const { result } = renderHookWithProviders(() => useDocumentDetailPageContainer(), {
      initialEntries,
      routePath,
    });

    await waitFor(() => expect(result.current.data.doc).not.toBeNull());
    expect(result.current.data.latestVersionId).toBe(1);
    expect(result.current.data.fileName).toBe("detail-test.pdf");

    result.current.actions.handleOpenEdit();
    result.current.actions.handleEditSuccess();

    await waitFor(() => expect(result.current.data.latestVersionId).toBe(2));
    expect(result.current.data.fileName).toBe("uploaded-latest.pdf");
  });
});
