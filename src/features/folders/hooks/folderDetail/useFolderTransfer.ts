import { useCallback, useState } from "react";
import { invalidateDocumentData } from "@/shared/lib/queryInvalidation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { handleApiError } from "@/app/adapter/api/client";
import { documentsApi } from "@/app/adapter/api/documents.api";
import type { Document } from "@/app/adapter/api/documents.api";

export type TransferMode = "docs" | "attachments" | null;

/**
 * Transfer modal state and confirm handler for moving docs/attachments to another folder.
 */
export function useFolderTransfer(
  mainDoc: Document | null,
  subDocs: Document[],
  folderDepartmentId: number | undefined,
  attachmentsDocId: number | "",
  loadFolderDocuments: () => Promise<void>,
  clearSubDocsSelection: () => void,
  clearAttachmentsSelection: () => void,
  refreshAttachmentsForCurrentDocument: () => void
) {
  const { t } = useTranslation();
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<TransferMode>(null);
  const [transferDocIds, setTransferDocIds] = useState<number[]>([]);
  const [transferAttachmentIds, setTransferAttachmentIds] = useState<number[]>([]);
  const [transferDepartmentId, setTransferDepartmentId] = useState(0);
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const openTransferDocs = useCallback(
    (ids: number[]) => {
      if (ids.length === 0) return;
      const folderDeptId = folderDepartmentId ?? mainDoc?.department_id;
      const depts = [
        ...new Set(
          ids
            .map((id) => subDocs.find((d) => d.id === id)?.department_id ?? folderDeptId)
            .filter((x): x is number => x != null && x > 0)
        ),
      ];
      if (depts.length > 1) {
        toast.error(t("folders.transferSameDepartment", { defaultValue: "Selected documents must be from the same department." }));
        return;
      }
      const departmentId = depts[0] ?? folderDeptId ?? 0;
      if (!departmentId) {
        toast.error(t("folders.transferFailed", { defaultValue: "Transfer failed." }));
        return;
      }
      setTransferDocIds(ids);
      setTransferDepartmentId(departmentId);
      setTransferMode("docs");
      setTransferModalOpen(true);
    },
    [subDocs, folderDepartmentId, mainDoc?.department_id, t]
  );

  const openTransferAttachments = useCallback(
    (ids: number[]) => {
      if (ids.length === 0) return;
      const deptId = mainDoc?.department_id ?? folderDepartmentId ?? 0;
      setTransferDepartmentId(deptId);
      setTransferAttachmentIds(ids);
      setTransferMode("attachments");
      setTransferModalOpen(true);
    },
    [mainDoc?.department_id, folderDepartmentId]
  );

  const closeTransferModal = useCallback(() => {
    if (!transferSubmitting) {
      setTransferModalOpen(false);
      setTransferMode(null);
      setTransferDocIds([]);
      setTransferAttachmentIds([]);
      setTransferDepartmentId(0);
    }
  }, [transferSubmitting]);

  const handleTransferConfirm = useCallback(
    async (targetFolderId: number) => {
      setTransferSubmitting(true);
      try {
        if (transferMode === "docs") {
          if (mainDoc && transferDocIds.includes(mainDoc.id)) {
            throw new Error(
              t("folders.transferMainDocumentNotAllowed", {
                defaultValue: "Main document cannot be transferred.",
              })
            );
          }
          await documentsApi.batchMoveDocumentsToFolder(transferDocIds, targetFolderId);
          void invalidateDocumentData();
          toast.success(t("folders.transferSuccess", { defaultValue: "Transferred successfully." }));
          clearSubDocsSelection();
          await loadFolderDocuments();
        } else if (transferMode === "attachments") {
          const sourceDocId = typeof attachmentsDocId === "number" ? attachmentsDocId : 0;
          if (!sourceDocId) {
            toast.error(t("folders.transferFailed", { defaultValue: "Transfer failed." }));
            return;
          }
          await documentsApi.batchMoveDocumentsToFolder(transferAttachmentIds, targetFolderId);
          void invalidateDocumentData();
          toast.success(t("folders.transferSuccess", { defaultValue: "Transferred successfully." }));
          clearAttachmentsSelection();
          refreshAttachmentsForCurrentDocument();
          await loadFolderDocuments();
        }
        setTransferModalOpen(false);
        setTransferMode(null);
        setTransferDocIds([]);
        setTransferAttachmentIds([]);
        setTransferDepartmentId(0);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : handleApiError(e);
        toast.error(message || t("folders.transferFailed", { defaultValue: "Transfer failed." }));
      } finally {
        setTransferSubmitting(false);
      }
    },
    [
      transferMode,
      transferDocIds,
      transferAttachmentIds,
      attachmentsDocId,
      mainDoc,
      t,
      clearSubDocsSelection,
      clearAttachmentsSelection,
      loadFolderDocuments,
      refreshAttachmentsForCurrentDocument,
    ]
  );

  return {
    transferModalOpen,
    transferMode,
    transferDocIds,
    transferAttachmentIds,
    transferDepartmentId,
    transferSubmitting,
    openTransferDocs,
    openTransferAttachments,
    closeTransferModal,
    handleTransferConfirm,
  };
}
