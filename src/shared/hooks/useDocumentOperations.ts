import { useCallback, useState } from "react";
import { handleApiError } from "../../app/adapter/api/client";
import { useDocumentStore } from "../../features/documents/stores/documentStore";
import { toast } from "react-toastify";

interface OperationOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void | Promise<void>;
}

interface TrashOptions extends OperationOptions {
  reason?: string;
}

interface PermanentDeleteOptions extends OperationOptions {
  confirmation?: string;
}

/**
 * Centralized document actions (archive/trash/restore/permanent delete)
 * with shared error handling and loading flags.
 */
export const useDocumentOperations = () => {
  const {
    archiveDocument,
    batchArchiveDocuments,
    unarchiveDocument,
    trashDocument,
    batchTrashDocuments,
    restoreDocument,
    permanentDeleteDocument,
  } = useDocumentStore();

  const [isArchivingSingle, setIsArchivingSingle] = useState(false);
  const [isArchivingBatch, setIsArchivingBatch] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [isTrashingSingle, setIsTrashingSingle] = useState(false);
  const [isTrashingBatch, setIsTrashingBatch] = useState(false);
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

  const archiveSingle = useCallback(
    async (documentId: number, options?: OperationOptions): Promise<boolean> => {
      setIsArchivingSingle(true);
      try {
        await archiveDocument(documentId);
        if (options?.successMessage) toast.success(options.successMessage);
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsArchivingSingle(false);
      }
    },
    [archiveDocument, getErrorMessage]
  );

  const archiveBatch = useCallback(
    async (documentIds: number[], options?: OperationOptions): Promise<boolean> => {
      if (documentIds.length === 0) return false;
      setIsArchivingBatch(true);
      try {
        await batchArchiveDocuments(documentIds);
        if (options?.successMessage) toast.success(options.successMessage);
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsArchivingBatch(false);
      }
    },
    [batchArchiveDocuments, getErrorMessage]
  );

  const unarchiveSingle = useCallback(
    async (documentId: number, options?: OperationOptions): Promise<boolean> => {
      setIsUnarchiving(true);
      try {
        await unarchiveDocument(documentId);
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
    [unarchiveDocument, getErrorMessage]
  );

  const trashSingle = useCallback(
    async (documentId: number, options?: TrashOptions): Promise<boolean> => {
      setIsTrashingSingle(true);
      try {
        await trashDocument(documentId, options?.reason);
        if (options?.successMessage) toast.success(options.successMessage);
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsTrashingSingle(false);
      }
    },
    [trashDocument, getErrorMessage]
  );

  const trashBatch = useCallback(
    async (documentIds: number[], options?: TrashOptions): Promise<boolean> => {
      if (documentIds.length === 0) return false;
      setIsTrashingBatch(true);
      try {
        await batchTrashDocuments(documentIds, options?.reason);
        if (options?.successMessage) toast.success(options.successMessage);
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsTrashingBatch(false);
      }
    },
    [batchTrashDocuments, getErrorMessage]
  );

  const restoreSingle = useCallback(
    async (documentId: number, options?: OperationOptions): Promise<boolean> => {
      setIsRestoring(true);
      try {
        await restoreDocument(documentId);
        if (options?.successMessage) toast.success(options.successMessage);
        await options?.onSuccess?.();
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, options?.errorMessage));
        return false;
      } finally {
        setIsRestoring(false);
      }
    },
    [restoreDocument, getErrorMessage]
  );

  const permanentDeleteSingle = useCallback(
    async (documentId: number, options?: PermanentDeleteOptions): Promise<boolean> => {
      setIsPermanentDeleting(true);
      try {
        await permanentDeleteDocument(documentId, options?.confirmation);
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
    [permanentDeleteDocument, getErrorMessage]
  );

  return {
    isArchivingSingle,
    isArchivingBatch,
    isUnarchiving,
    isTrashingSingle,
    isTrashingBatch,
    isRestoring,
    isPermanentDeleting,
    archiveSingle,
    archiveBatch,
    unarchiveSingle,
    trashSingle,
    trashBatch,
    restoreSingle,
    permanentDeleteSingle,
  };
};
