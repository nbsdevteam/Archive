import { useCallback, useState } from "react";
import { handleApiError } from "@/app/adapter/api/client";
import { useDocumentStore } from "../stores/documentStore";
import { toast } from "react-toastify";

interface OperationOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void | Promise<void>;
}

interface TrashOptions extends OperationOptions {
  reason?: string;
}

/**
 * Centralized document actions (archive/trash/restore/permanent delete)
 * with shared error handling and loading flags. Lives in documents feature
 * to avoid pulling document store into shared barrel (circular chunk).
 */
export const useDocumentOperations = () => {
  const {
    archiveDocument,
    unarchiveDocument,
    trashDocument,
    restoreDocument,
    permanentDeleteDocuments,
  } = useDocumentStore();

  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [isTrashing, setIsTrashing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

  const getErrorMessage = useCallback(
    (error: unknown, fallback?: string) => {
      const apiMessage = handleApiError(error);
      if (apiMessage && apiMessage !== "An unexpected error occurred") {
        return apiMessage;
      }
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return fallback ?? "Operation failed.";
    },
    []
  );

  /** Ensures all operations can receive either one document id or multiple ids. */
  const toDocumentIds = useCallback((documentIds: number | number[]): number[] => {
    const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
    return ids.filter((id): id is number => Number.isFinite(id));
  }, []);

  const archiveDocumentAction = useCallback(
    async (documentIds: number | number[], options?: OperationOptions): Promise<boolean> => {
      const ids = toDocumentIds(documentIds);
      if (ids.length === 0) return false;
      setIsArchiving(true);
      try {
        await archiveDocument(ids);
        if (options?.successMessage) toast.success(options.successMessage);
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsArchiving(false);
      }
    },
    [archiveDocument, getErrorMessage, toDocumentIds]
  );

  const unarchiveDocumentAction = useCallback(
    async (documentIds: number | number[], options?: OperationOptions): Promise<boolean> => {
      const ids = toDocumentIds(documentIds);
      if (ids.length === 0) return false;
      setIsUnarchiving(true);
      try {
        await unarchiveDocument(ids);
        if (options?.successMessage) toast.success(options.successMessage);
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsUnarchiving(false);
      }
    },
    [getErrorMessage, toDocumentIds, unarchiveDocument]
  );

  const trashDocumentAction = useCallback(
    async (documentIds: number | number[], options?: TrashOptions): Promise<boolean> => {
      const ids = toDocumentIds(documentIds);
      if (ids.length === 0) return false;
      setIsTrashing(true);
      try {
        await trashDocument(ids, options?.reason);
        if (options?.successMessage) toast.success(options.successMessage);
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsTrashing(false);
      }
    },
    [getErrorMessage, toDocumentIds, trashDocument]
  );

  /** Restore uses API result { restored, failed }; shows success only when restored.length > 0, error when failed.length > 0. */
  const restoreDocumentAction = useCallback(
    async (documentIds: number | number[], options?: OperationOptions): Promise<boolean> => {
      const ids = toDocumentIds(documentIds);
      if (ids.length === 0) return false;
      setIsRestoring(true);
      try {
        const { restored, failed } = await restoreDocument(ids);
        if (restored.length > 0) {
          if (options?.successMessage) toast.success(options.successMessage);
          await options?.onSuccess?.();
        }
        if (failed.length > 0) {
          const failMsg =
            failed.length === 1
              ? (options?.errorMessage ?? "Failed to restore document.")
              : `${failed.length} document(s) could not be restored.`;
          toast.error(failMsg);
        }
        return restored.length > 0;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsRestoring(false);
      }
    },
    [getErrorMessage, restoreDocument, toDocumentIds]
  );

  const permanentDeleteSingle = useCallback(
    async (documentId: number, options?: OperationOptions): Promise<boolean> => {
      setIsPermanentDeleting(true);
      try {
        await permanentDeleteDocuments([documentId]);
        if (options?.successMessage) toast.success(options.successMessage);
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsPermanentDeleting(false);
      }
    },
    [permanentDeleteDocuments, getErrorMessage]
  );

  const permanentDeleteBatch = useCallback(
    async (documentIds: number[], options?: OperationOptions): Promise<boolean> => {
      if (documentIds.length === 0) return false;
      setIsPermanentDeleting(true);
      try {
        await permanentDeleteDocuments(documentIds);
        if (options?.successMessage) toast.success(options.successMessage);
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsPermanentDeleting(false);
      }
    },
    [permanentDeleteDocuments, getErrorMessage]
  );

  return {
    isArchiving,
    isUnarchiving,
    isTrashing,
    isRestoring,
    isPermanentDeleting,
    archiveDocument: archiveDocumentAction,
    unarchiveDocument: unarchiveDocumentAction,
    trashDocument: trashDocumentAction,
    restoreDocument: restoreDocumentAction,
    permanentDeleteSingle,
    permanentDeleteBatch,
  };
};
