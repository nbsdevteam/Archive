import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { AppProviders } from "@/app/providers/AppProviders";
import { useDocumentAttachments } from "./useDocumentAttachments";

const mockListAttachments = vi.fn();
const mockUpdateAttachment = vi.fn();

vi.mock("@/app/adapter/api/documents.api", () => ({
  documentsApi: {
    listAttachments: (...args: unknown[]) => mockListAttachments(...args),
    updateAttachment: (...args: unknown[]) => mockUpdateAttachment(...args),
    downloadAttachment: vi.fn().mockResolvedValue(new Blob()),
    deleteAttachment: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock("@/shared/utils/files/downloadBlobAsFile", () => ({
  downloadBlobAsFile: vi.fn(),
}));

const mockFileToBase64 = vi.fn();
vi.mock("@/shared/utils/files/fileToBase64", () => ({
  fileToBase64: (...args: unknown[]) => mockFileToBase64(...args),
}));

const attachments = [
  { id: 1, name: "A1", file_name: "a1.pdf", description: "Desc 1" },
  { id: 2, name: "A2", file_name: "a2.pdf", description: null },
];

function wrapper({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}

describe("useDocumentAttachments", () => {
  const docId = 99;
  const activeTab = "attachments";

  beforeEach(() => {
    vi.clearAllMocks();
    mockListAttachments.mockResolvedValue({ success: true, data: attachments });
    mockUpdateAttachment.mockResolvedValue({ success: true });
    mockFileToBase64.mockResolvedValue("base64content");
  });

  it("loads attachments when activeTab is attachments and exposes edit state", async () => {
    const { result } = renderHook(
      () => useDocumentAttachments(docId, activeTab),
      { wrapper }
    );

    await waitFor(() => expect(result.current.loadingAttachments).toBe(false));
    expect(result.current.attachments).toHaveLength(2);
    expect(result.current.editAttachmentId).toBeNull();
    expect(result.current.editAttachmentName).toBe("");
    expect(result.current.editAttachmentDescription).toBe("");
  });

  it("handleOpenEditAttachment sets edit state from the matching attachment", async () => {
    const { result } = renderHook(
      () => useDocumentAttachments(docId, activeTab),
      { wrapper }
    );

    await waitFor(() => expect(result.current.attachments).toHaveLength(2));

    result.current.handleOpenEditAttachment(2);

    await waitFor(() => expect(result.current.editAttachmentId).toBe(2));
    expect(result.current.editAttachmentName).toBe("A2");
    expect(result.current.editAttachmentDescription).toBe("");
  });

  it("clearEditAttachmentState resets edit id and form fields", async () => {
    const { result } = renderHook(
      () => useDocumentAttachments(docId, activeTab),
      { wrapper }
    );

    await waitFor(() => expect(result.current.attachments).toHaveLength(2));
    result.current.handleOpenEditAttachment(1);
    await waitFor(() => expect(result.current.editAttachmentId).toBe(1));

    result.current.clearEditAttachmentState();

    await waitFor(() => expect(result.current.editAttachmentId).toBeNull());
    expect(result.current.editAttachmentName).toBe("");
    expect(result.current.editAttachmentDescription).toBe("");
  });

  it("handleConfirmEditAttachment calls updateAttachment with name/description and onEditSuccess on success", async () => {
    const onEditSuccess = vi.fn();
    const { result } = renderHook(
      () => useDocumentAttachments(docId, activeTab, { onEditSuccess }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.attachments).toHaveLength(2));
    result.current.handleOpenEditAttachment(1);
    await waitFor(() => expect(result.current.editAttachmentId).toBe(1));
    result.current.setEditAttachmentName("Updated name");
    result.current.setEditAttachmentDescription("Updated desc");
    await waitFor(() => expect(result.current.editAttachmentName).toBe("Updated name"));
    await waitFor(() => expect(result.current.editAttachmentDescription).toBe("Updated desc"));

    await result.current.handleConfirmEditAttachment();

    expect(mockUpdateAttachment).toHaveBeenCalledWith(99, 1, {
      name: "Updated name",
      description: "Updated desc",
    });
    expect(onEditSuccess).toHaveBeenCalled();
    await waitFor(() => expect(result.current.editAttachmentId).toBeNull());
  });

  it("handleConfirmEditAttachment with replaceFile includes file_data and file_name in payload", async () => {
    mockFileToBase64.mockResolvedValue("base64content");
    const { result } = renderHook(
      () => useDocumentAttachments(docId, activeTab),
      { wrapper }
    );

    await waitFor(() => expect(result.current.attachments).toHaveLength(2));
    result.current.handleOpenEditAttachment(1);
    await waitFor(() => expect(result.current.editAttachmentId).toBe(1));
    result.current.setEditAttachmentName("With file");
    await waitFor(() => expect(result.current.editAttachmentName).toBe("With file"));

    const file = new File(["content"], "new.pdf", { type: "application/pdf" });
    await result.current.handleConfirmEditAttachment(file);

    expect(mockFileToBase64).toHaveBeenCalledWith(file);
    expect(mockUpdateAttachment).toHaveBeenCalledWith(99, 1, {
      name: "With file",
      description: "Desc 1",
      file_data: "base64content",
      file_name: "new.pdf",
    });
  });

  it("handleCloseEditAttachment clears edit state when not updating", async () => {
    const { result } = renderHook(
      () => useDocumentAttachments(docId, activeTab),
      { wrapper }
    );

    await waitFor(() => expect(result.current.attachments).toHaveLength(2));
    result.current.handleOpenEditAttachment(1);
    result.current.handleCloseEditAttachment();

    expect(result.current.editAttachmentId).toBeNull();
    expect(result.current.editAttachmentName).toBe("");
    expect(result.current.editAttachmentDescription).toBe("");
  });
});
