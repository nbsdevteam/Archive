import { useCallback, useState } from "react";

/** Resolved from folder detail + main document (GET /documents/:id) for upload prefills. */
export type FolderUploadContextHint = {
  folder_name?: string;
  folder_code?: string;
  folder_company_id?: number;
  folder_company_name?: string;
};

export type UploadPanelInitialValues = Partial<{
  upload_kind: "main" | "sub" | "attachment";
  folder_id: number;
  department_id: number;
  target_document_id: number;
  folder_company_id: number;
  folder_company_name: string;
  folder_name: string;
  folder_code: string;
}>;

/**
 * Manages upload panel open state and initial values for folder context.
 * @param folderUploadHint Company and folder labels from `folder` and/or loaded `mainDoc` (documents API includes company_name).
 */
export function useFolderUploadPanel(
  folderId: number | null,
  folderDepartmentId: number | undefined,
  documentsCount: number,
  attachmentsDocId: number | "",
  folderUploadHint?: FolderUploadContextHint | null
) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadPanelLockFolderContext, setUploadPanelLockFolderContext] = useState(false);
  const [uploadPanelInitialValues, setUploadPanelInitialValues] = useState<UploadPanelInitialValues>({});

  const handleUploadInFolder = useCallback(() => {
    if (!folderId) return;
    const kind = documentsCount === 0 ? "main" : "sub";
    setUploadPanelLockFolderContext(true);
    const hint = folderUploadHint ?? {};
    const initialValues: UploadPanelInitialValues = {
      upload_kind: kind,
      folder_id: folderId,
      department_id: folderDepartmentId ?? 0,
      ...(hint.folder_company_id != null &&
        hint.folder_company_id >= 1 && { folder_company_id: hint.folder_company_id }),
      ...(hint.folder_company_name != null &&
        hint.folder_company_name.trim() !== "" && { folder_company_name: hint.folder_company_name.trim() }),
      ...(hint.folder_name != null && hint.folder_name.trim() !== "" && { folder_name: hint.folder_name.trim() }),
      ...(hint.folder_code != null && hint.folder_code.trim() !== "" && { folder_code: hint.folder_code.trim() }),
    };

    if (import.meta.env.DEV) {
      console.log("[useFolderUploadPanel] Opening upload panel with initialValues:", initialValues);
    }

    setUploadPanelInitialValues(initialValues);
    setIsUploadOpen(true);
  }, [folderId, documentsCount, folderDepartmentId, folderUploadHint]);

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
