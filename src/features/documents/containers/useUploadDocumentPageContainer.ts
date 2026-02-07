import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { UploadDocumentFormValues } from "../components";

export const useUploadDocumentPageContainer = () => {
  const [searchParams] = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(true);

  const initialValues = useMemo((): Partial<UploadDocumentFormValues> | undefined => {
    const uploadKind = searchParams.get("upload_kind");
    const folderId = searchParams.get("folder_id");
    const departmentId = searchParams.get("department_id");
    const targetDocId = searchParams.get("target_document_id");
    if (!uploadKind && !folderId && !departmentId && !targetDocId) return undefined;
    const out: Partial<UploadDocumentFormValues> = {};
    if (uploadKind === "main" || uploadKind === "sub" || uploadKind === "attachment") {
      out.upload_kind = uploadKind;
    }
    if (folderId) {
      const n = Number(folderId);
      if (!Number.isNaN(n)) out.folder_id = n;
    }
    if (departmentId) {
      const n = Number(departmentId);
      if (!Number.isNaN(n)) out.department_id = n;
    }
    if (targetDocId) {
      const n = Number(targetDocId);
      if (!Number.isNaN(n)) out.target_document_id = n;
    }
    return Object.keys(out).length ? out : undefined;
  }, [searchParams]);

  const handleOpenPanel = () => setPanelOpen(true);
  const handleClosePanel = () => setPanelOpen(false);

  return {
    panelOpen,
    initialValues,
    handleOpenPanel,
    handleClosePanel,
  };
};
