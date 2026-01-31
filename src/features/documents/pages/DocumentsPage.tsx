import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { useDocumentStore } from "../stores/documentStore";
import { UploadDocumentSidePanel } from "../components";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { Spinner, Alert, Input, Icon } from "../../../shared/components/ui";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import "../styles/documents.css";

/**
 * DocumentsPage - Documents management page with search and table
 */
const DocumentsPage = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const { documents, isLoading, fetchDocuments, error, clearError, pagination } = useDocumentStore();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 1) {
      fetchDocuments({ search: debouncedQuery.trim() });
    } else if (debouncedQuery.trim().length === 0) {
      fetchDocuments();
    }
  }, [debouncedQuery, fetchDocuments]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNavigateToDocument = (documentId: number) => {
    navigate(`${routes.documentDetail.replace(":id", documentId.toString())}`);
  };

  const handleOpenUpload = () => {
    setIsUploadOpen(true);
  };

  const handleUploadSuccess = () => {
    if (debouncedQuery.trim()) {
      fetchDocuments({ search: debouncedQuery.trim() });
    } else {
      fetchDocuments();
    }
    setIsUploadOpen(false);
  };

  const handleRetry = () => {
    clearError();
    fetchDocuments();
  };

  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s === "active") return "success";
    if (s === "failed" || s === "error" || s === "rejected") return "danger";
    if (s === "archived") return "secondary";
    return "info";
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Documents</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Documents
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="me-2 mb-2">
              <button
                onClick={handleOpenUpload}
                className="btn btn-secondary btn-md d-inline-flex align-items-center"
              >
                <Icon name="upload" className="me-2" />
                Upload Files
              </button>
            </div>
            <div className="ms-2 head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>

        <div className="card documents__search-card mb-3">
          <div className="card-body">
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="documents__search-input"
            />
          </div>
        </div>

        <div className="card documents__table-card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">Documents</h5>
            <span className="text-muted fs-13">
              {isLoading ? "Loading..." : `${documents?.length ?? 0} ${documents?.length === 1 ? "document" : "documents"}`}
            </span>
          </div>
          <div className="card-body">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <button
                  className="btn btn-sm btn-outline-primary ms-2"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              </Alert>
            )}
            {isLoading ? (
              <div className="text-center py-4">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Barcode</th>
                      <th>Type</th>
                      <th>Department</th>
                      <th>Upload Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          No documents found
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => (
                        <tr key={doc.id} style={{ cursor: "pointer" }} onClick={() => handleNavigateToDocument(doc.id)}>
                          <td>{doc.name || doc.title || "-"}</td>
                          <td>{doc.barcode || "-"}</td>
                          <td>{doc.document_type_name || doc.document_type?.name || "-"}</td>
                          <td>{doc.department_name || doc.department?.name || "-"}</td>
                          <td>
                            {doc.upload_date
                              ? formatRelativeTime(new Date(doc.upload_date))
                              : "-"}
                          </td>
                          <td>
                            <span className={`badge bg-${getStatusBadgeVariant(doc.status)}`}>
                              {doc.status || "unknown"}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-light me-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToDocument(doc.id);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <UploadDocumentSidePanel
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default DocumentsPage;
