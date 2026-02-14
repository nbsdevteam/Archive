import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Button, Icon } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useArchiveUploadPageContainer } from "../containers/useArchiveUploadPageContainer";

const ArchiveUpload = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const {
    fileInputRef,
    selectedFiles,
    formData,
    uploading,
    error,
    uploadedDocument,
    setFormData,
    handleFileChange,
    handleRemoveFile,
    handleClearAllFiles,
    handleSubmit,
  } = useArchiveUploadPageContainer();

  return (
    <PageLayout
      title={t("documents.upload", { defaultValue: "Upload" })}
      breadcrumbItems={[{ label: t("archive.breadcrumb", { defaultValue: "Archive" }) }]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">{t("archive.uploadFilesOrFolders", { defaultValue: "Upload Files or Folders" })}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">{t("documents.documentTitle", { defaultValue: "Document Title" })}</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t("documents.enterDocumentTitle", { defaultValue: "Enter document title" })}
                />
              </div>

              <div className="border rounded p-4 text-center mb-3">
                <Icon name="upload" className="fs-1 text-primary mb-3" />
                <p className="mb-2">{t("archive.dragAndDrop", { defaultValue: "Drag and drop files here, or click to browse." })}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="form-control"
                  multiple
                  onChange={handleFileChange}
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="text-muted mb-1">{t("archive.selectedFiles", { defaultValue: "Selected files:" })}</p>
                      {selectedFiles.length > 1 && (
                        <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={handleClearAllFiles}>
                          <Icon name="x" className="me-1" />
                          {t("common.clearAll", { defaultValue: "Remove all" })}
                        </Button>
                      )}
                    </div>
                    <ul className="list-unstyled">
                      {selectedFiles.map((file, idx) => (
                        <li key={idx} className="text-start d-flex align-items-center justify-content-between gap-2">
                          <small>
                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </small>
                          <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={() => handleRemoveFile(idx)}>
                            <Icon name="trash" className="me-1" />
                            {t("common.remove", { defaultValue: "Remove" })}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {uploadedDocument && (
                <div className="alert alert-success" role="alert">
                  {t("documents.uploadSuccess", { defaultValue: "File uploaded successfully!" })}
                </div>
              )}

              <div className="d-flex justify-content-end mt-3">
                <Link to={routes.archiveDocuments} className="btn btn-light me-2">
                  {t("common.cancel", { defaultValue: "Cancel" })}
                </Link>
                <Button
                  type="submit"
                  variant="outline"
                  className="btn-outline-secondary"
                  isLoading={uploading}
                  disabled={uploading || selectedFiles.length === 0}
                >
                  {t("documents.upload", { defaultValue: "Upload" })}
                </Button>
              </div>
            </form>
          </div>
        </div>
    </PageLayout>
  );
};

export default ArchiveUpload;
