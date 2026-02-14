import { toast } from "react-toastify";
import { documentsApi } from "../../../app/adapter/api/documents.api";
import { handleApiError } from "../../../app/adapter/api/client";
import { downloadBlobAsFile } from "../files/downloadBlobAsFile";

/** Minimal i18n translate signature used for success/error toasts. */
type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

/**
 * Downloads a document by id via the documents API, saves it as a file using the given
 * fileName, and shows success/error toasts. Uses documents.downloadSuccess and
 * documents.downloadFailed i18n keys. Centralizes DRY logic for document download + toast.
 */
export async function downloadDocumentWithToast(
  documentId: number,
  fileName: string,
  t: TranslateFn
): Promise<void> {
  try {
    const blob = await documentsApi.downloadDocument(documentId);
    const name = (fileName || "document").trim() || "document";
    downloadBlobAsFile(blob, name);
    toast.success(t("documents.downloadSuccess", { defaultValue: "Download started." }));
  } catch (err) {
    toast.error(
      handleApiError(err) || t("documents.downloadFailed", { defaultValue: "Download failed." })
    );
  }
}
