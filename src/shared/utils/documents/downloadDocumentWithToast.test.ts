import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadDocumentWithToast } from "./downloadDocumentWithToast";

const mockDownloadDocument = vi.fn();
const mockDownloadBlobAsFile = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockHandleApiError = vi.fn();

vi.mock("../../../app/adapter/api/documents.api", () => ({
  documentsApi: {
    downloadDocument: (...args: unknown[]) => mockDownloadDocument(...args),
  },
}));

vi.mock("../files/downloadBlobAsFile", () => ({
  downloadBlobAsFile: (...args: unknown[]) => mockDownloadBlobAsFile(...args),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("../../../app/adapter/api/client", () => ({
  handleApiError: (err: unknown) => mockHandleApiError(err),
}));

describe("downloadDocumentWithToast", () => {
  const t = (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleApiError.mockReturnValue("API error message");
  });

  it("calls downloadDocument and downloadBlobAsFile and shows success toast on success", async () => {
    const blob = new Blob(["test"]);
    mockDownloadDocument.mockResolvedValue(blob);

    await downloadDocumentWithToast(42, "my-file.pdf", t);

    expect(mockDownloadDocument).toHaveBeenCalledWith(42);
    expect(mockDownloadBlobAsFile).toHaveBeenCalledWith(blob, "my-file.pdf");
    expect(mockToastSuccess).toHaveBeenCalledWith("Download started.");
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("uses default fileName when empty", async () => {
    mockDownloadDocument.mockResolvedValue(new Blob());

    await downloadDocumentWithToast(1, "  ", t);

    expect(mockDownloadBlobAsFile).toHaveBeenCalledWith(expect.any(Blob), "document");
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("shows error toast with handleApiError message on failure", async () => {
    mockDownloadDocument.mockRejectedValue(new Error("Network error"));
    mockHandleApiError.mockReturnValue("Network error");

    await downloadDocumentWithToast(1, "file.pdf", t);

    expect(mockDownloadBlobAsFile).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockHandleApiError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockToastError).toHaveBeenCalledWith("Network error");
  });

  it("uses default error message when handleApiError returns empty", async () => {
    mockDownloadDocument.mockRejectedValue(new Error("Unknown"));
    mockHandleApiError.mockReturnValue("");

    await downloadDocumentWithToast(1, "file.pdf", t);

    expect(mockToastError).toHaveBeenCalledWith("Download failed.");
  });
});
