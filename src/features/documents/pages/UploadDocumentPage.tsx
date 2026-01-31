import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import { UploadDocumentSidePanel } from "../components";
import type { UploadDocumentFormValues } from "../components";
import { Icon } from "../../../shared/components/ui";

/**
 * UploadDocumentPage - Upload document UI (legacy route /documents/upload).
 * Supports legacy query params: upload_kind, folder_id, department_id, target_document_id.
 */
const UploadDocumentPage = () => {
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

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Upload Document</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={all_routes.dashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={all_routes.documents}>Documents</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Upload
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="card border-0">
          <div className="card-body text-center py-5">
            <p className="text-muted mb-4">
              Upload a new document by selecting department, document type, title, and file.
            </p>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => setPanelOpen(true)}>
              <Icon name="upload" className="me-2" />
              Upload Document
            </button>
          </div>
        </div>

        <UploadDocumentSidePanel
          isOpen={panelOpen}
          onClose={() => setPanelOpen(false)}
          initialValues={initialValues}
        />
      </div>
    </div>
  );
};

export default UploadDocumentPage;
