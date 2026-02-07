import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import { UploadDocumentSidePanel } from "../components";
import { Button, Icon } from "../../../shared/components/ui";
import { useUploadDocumentPageContainer } from "../containers/useUploadDocumentPageContainer";

/**
 * UploadDocumentPage - Upload document UI (legacy route /documents/upload).
 * Supports legacy query params: upload_kind, folder_id, department_id, target_document_id.
 */
const UploadDocumentPage = () => {
  const { panelOpen, initialValues, handleOpenPanel, handleClosePanel } = useUploadDocumentPageContainer();

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">Upload Document</h2>
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
            <Button variant="outline" size="lg" className="btn-outline-secondary" onClick={handleOpenPanel}>
              <Icon name="file-up" className="me-2" />
              Upload Document
            </Button>
          </div>
        </div>

        <UploadDocumentSidePanel
          isOpen={panelOpen}
          onClose={handleClosePanel}
          initialValues={initialValues}
        />
      </div>
    </div>
  );
};

export default UploadDocumentPage;
