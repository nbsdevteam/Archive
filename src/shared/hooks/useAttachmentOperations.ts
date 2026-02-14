import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { documentsApi } from "../../app/adapter/api/documents.api";
import { handleApiError } from "../../app/adapter/api/client";
import { downloadBlobAsFile } from "../utils/files/downloadBlobAsFile";

interface UseAttachmentOperationsOptions {
  onSuccess?: () => void | Promise<void>;
}

/**
 * Shared attachment operations to keep list pages consistent.
 */
export const useAttachmentOperations = (
  documentId: number | null,
  options?: UseAttachmentOperationsOptions
) => {
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);
  const [isUpdatingAttachment, setIsUpdatingAttachment] = useState(false);

  const reportError = useCallback((error: unknown, fallback: string) => {
    const apiMessage = handleApiError(error);
    const message =
      apiMessage !== "An unexpected error occurred"
        ? apiMessage
        : error instanceof Error
          ? error.message
          : fallback;
    toast.error(message || fallback);
  }, []);

  const downloadAttachment = useCallback(
    async (attachmentId: number, fileName: string, successMessage?: string) => {
      if (!documentId) return false;
      try {
        const blob = await documentsApi.downloadAttachment(documentId, attachmentId);
        downloadBlobAsFile(blob, fileName);
        if (successMessage) toast.success(successMessage);
        return true;
      } catch (error) {
        reportError(error, "Download failed.");
        return false;
      }
    },
    [documentId, reportError]
  );

  const deleteAttachments = useCallback(
    async (attachmentIds: number[]) => {
      if (!documentId || attachmentIds.length === 0) return false;
      setIsDeletingAttachment(true);
      try {
        const results = await Promise.allSettled(
          attachmentIds.map((attachmentId) =>
            documentsApi.deleteAttachment(documentId, attachmentId)
          )
        );
        const failedCount = results.filter((r) => r.status === "rejected").length;
        if (failedCount === attachmentIds.length) {
          toast.error("Failed to delete attachment(s).");
          return false;
        }
        if (failedCount > 0) {
          toast.warning(`${failedCount} attachment(s) could not be deleted.`);
        } else {
          toast.success("Attachment(s) deleted.");
        }
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        reportError(error, "Failed to delete attachment(s).");
        return false;
      } finally {
        setIsDeletingAttachment(false);
      }
    },
    [documentId, options, reportError]
  );

  const updateAttachment = useCallback(
    async (
      attachmentId: number,
      payload: {
        name?: string;
        description?: string | null;
        attachment_type?: string;
        file_data?: string;
        file_name?: string;
      }
    ) => {
      if (!documentId) return false;
      setIsUpdatingAttachment(true);
      try {
        await documentsApi.updateAttachment(documentId, attachmentId, payload);
        toast.success("Attachment updated.");
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        reportError(error, "Failed to update attachment.");
        return false;
      } finally {
        setIsUpdatingAttachment(false);
      }
    },
    [documentId, options, reportError]
  );

  return {
    isDeletingAttachment,
    isUpdatingAttachment,
    downloadAttachment,
    deleteAttachment: (attachmentId: number) => deleteAttachments([attachmentId]),
    deleteAttachments,
    updateAttachment,
  };
};
