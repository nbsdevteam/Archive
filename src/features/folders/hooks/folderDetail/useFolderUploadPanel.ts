import { useCallback, useState } from "react";

export type UploadPanelInitialValues = Partial<{
  upload_kind: "main" | "sub" | "attachment";
  folder_id: number;
  department_id: number;
  target_document_id: number;
}>;

/**
 * Manages upload panel open state and initial values for folder context.
 */
export function useFolderUploadPanel(
  folderId: number | null,
  folderDepartmentId: number | undefined,
  documentsCount: number,
  attachmentsDocId: number | ""
) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadPanelLockFolderContext, setUploadPanelLockFolderContext] = useState(false);
  const [uploadPanelInitialValues, setUploadPanelInitialValues] = useState<UploadPanelInitialValues>({});

  const handleUploadInFolder = useCallback(() => {
    if (!folderId) return;
    const kind = documentsCount === 0 ? "main" : "sub";
    setUploadPanelLockFolderContext(true);
    setUploadPanelInitialValues({
      upload_kind: kind,
      folder_id: folderId,
      department_id: folderDepartmentId ?? 0,
    });
    setIsUploadOpen(true);
  }, [folderId, documentsCount, folderDepartmentId]);

  const handleAddAttachment = useCallback(() => {
    setUploadPanelLockFolderContext(true);
    setUploadPanelInitialValues({
      upload_kind: "attachment",
      target_document_id: typeof attachmentsDocId === "number" ? attachmentsDocId : 0,
    });
    setIsUploadOpen(true);
  }, [attachmentsDocId]);

  const handleCloseUploadPanel = useCallback(() => setIsUploadOpen(false), []);

  return {
    isUploadOpen,
    uploadPanelLockFolderContext,
    uploadPanelInitialValues,
    handleUploadInFolder,
    handleAddAttachment,
    handleCloseUploadPanel,
    setIsUploadOpen,
  };
}
