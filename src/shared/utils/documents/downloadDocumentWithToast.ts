import { toast } from "react-toastify";
import { documentsApi } from "@/app/adapter/api/documents.api";
import { handleApiError } from "@/app/adapter/api/client";
import { downloadBlobAsFile } from "@/shared/utils/files/downloadBlobAsFile";

/** Minimal i18n translate signature used for success/error toasts. */
type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

/** Optional screen-reader announce function (e.g. from useAnnounce()). */
export type AnnounceFn = (message: string) => void;

/**
 * Downloads a document by id via the documents API, saves it as a file using the given
 * fileName, and shows success/error toasts. Uses documents.downloadSuccess and
 * documents.downloadFailed i18n keys. When announce is provided, also announces
 * success/error for screen readers.
 */
export async function downloadDocumentWithToast(
  documentId: number,
  fileName: string,
  t: TranslateFn,
  announce?: AnnounceFn
): Promise<void> {
  try {
    const blob = await documentsApi.downloadDocument(documentId);
    const name = (fileName || "document").trim() || "document";
    downloadBlobAsFile(blob, name);
    const successMsg = t("documents.downloadSuccess", { defaultValue: "Download started." });
    toast.success(successMsg);
    announce?.(successMsg);
  } catch (err) {
    const errorMsg =
      handleApiError(err) || t("documents.downloadFailed", { defaultValue: "Download failed." });
    toast.error(errorMsg);
    announce?.(errorMsg);
  }
}
