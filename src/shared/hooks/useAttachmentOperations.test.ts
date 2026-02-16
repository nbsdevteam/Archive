import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { toast } from "react-toastify";
import { useAttachmentOperations } from "./useAttachmentOperations";

const mockUpdateAttachment = vi.fn();
const mockDownloadAttachment = vi.fn();
const mockDeleteAttachment = vi.fn();

vi.mock("../../app/adapter/api/documents.api", () => ({
  documentsApi: {
    updateAttachment: (...args: unknown[]) => mockUpdateAttachment(...args),
    downloadAttachment: (...args: unknown[]) => mockDownloadAttachment(...args),
    deleteAttachment: (...args: unknown[]) => mockDeleteAttachment(...args),
  },
}));

vi.mock("../../utils/files/downloadBlobAsFile", () => ({
  downloadBlobAsFile: vi.fn(),
}));

describe("useAttachmentOperations", () => {
  const documentId = 10;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateAttachment.mockResolvedValue({ success: true });
    mockDownloadAttachment.mockResolvedValue(new Blob());
    mockDeleteAttachment.mockResolvedValue({ success: true });
  });

  describe("updateAttachment", () => {
    it("calls documentsApi.updateAttachment with name and description and invokes onSuccess", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useAttachmentOperations(documentId, { onSuccess })
      );

      await result.current.updateAttachment(5, {
        name: "New name",
        description: "New description",
      });

      expect(mockUpdateAttachment).toHaveBeenCalledWith(10, 5, {
        name: "New name",
        description: "New description",
      });
      expect(toast.success).toHaveBeenCalledWith("Attachment updated.");
      expect(onSuccess).toHaveBeenCalled();
    });

    it("calls updateAttachment with optional file_data and file_name for replace", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useAttachmentOperations(documentId, { onSuccess })
      );

      await result.current.updateAttachment(7, {
        name: "Rename",
        description: null,
        file_data: "base64data",
        file_name: "newfile.pdf",
      });

      expect(mockUpdateAttachment).toHaveBeenCalledWith(10, 7, {
        name: "Rename",
        description: null,
        file_data: "base64data",
        file_name: "newfile.pdf",
      });
      expect(onSuccess).toHaveBeenCalled();
    });

    it("returns false and does not call onSuccess when documentId is null", async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useAttachmentOperations(null, { onSuccess })
      );

      const ok = await result.current.updateAttachment(1, { name: "X" });

      expect(ok).toBe(false);
      expect(mockUpdateAttachment).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("returns false and shows error toast when API fails", async () => {
      mockUpdateAttachment.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() =>
        useAttachmentOperations(documentId, { onSuccess: vi.fn() })
      );

      const ok = await result.current.updateAttachment(1, { name: "X" });

      expect(ok).toBe(false);
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
