import { all_routes } from "../../../router/all_routes";
import { UploadDocumentSidePanel } from "../components";
import { Button, Icon } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useUploadDocumentPageContainer } from "../containers/useUploadDocumentPageContainer";

/**
 * UploadDocumentPage - Upload document UI (legacy route /documents/upload).
 * Supports legacy query params: upload_kind, folder_id, department_id, target_document_id.
 */
const UploadDocumentPage = () => {
  const { panelOpen, initialValues, handleOpenPanel, handleClosePanel } = useUploadDocumentPageContainer();

  return (
    <PageLayout
      title="Upload Document"
      breadcrumbItems={[{ label: "Documents", to: all_routes.documents }]}
      homeTo={all_routes.dashboard}
    >
        <div className="card border-0">
          <div className="card-body text-center py-5">
            <p className="text-muted mb-4">
              Upload a new document by selecting department, document type, title, and file.
            </p>
            <Button variant="outline" size="lg" className="btn-outline-secondary" onClick={handleOpenPanel} data-testid="upload-document-open-btn">
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
    </PageLayout>
  );
};

export default UploadDocumentPage;
