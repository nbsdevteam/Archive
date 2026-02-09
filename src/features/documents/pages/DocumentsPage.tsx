import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { UploadDocumentSidePanel } from "../components";
import { Button, Spinner, Alert, Icon, SearchInput, ListFilter } from "../../../shared/components/ui";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import { useDocumentsPageContainer } from "../containers/useDocumentsPageContainer";
import "../styles/documents.css";

/**
 * DocumentsPage - Documents management page with search and table
 */
const DocumentsPage = () => {
  const { t } = useTranslation();
  const {
    routes,
    documents,
    isLoading,
    error,
    isUploadOpen,
    handleSearchDebounced,
    handleNavigateToDocument,
    handleOpenUpload,
    handleCloseUpload,
    handleUploadSuccess,
    handleRetry,
    handleRefresh,
    getDocumentStatusBadgeVariant,
    isFilterOpen,
    draftFilters,
    departmentOptions,
    documentTypeOptions,
    handleOpenFilter,
    handleCloseFilter,
    handlePrimaryFilterChange,
    handleSecondaryFilterChange,
    handleApplyFilter,
    handleClearFilter,
    filterApplyDisabled,
  } = useDocumentsPageContainer();

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">Documents</h2>
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
            <div className="ms-2 head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>

        <div className="card documents__table-card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0">Documents</h5>
              <span className="text-muted fs-13">
                {isLoading ? "Loading..." : <><span className="Num">{documents?.length ?? 0}</span> {documents?.length === 1 ? "document" : "documents"}</>}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2 documents__header-actions">
              <SearchInput
                placeholder="Search documents..."
                debounceMs={300}
                onDebouncedChange={handleSearchDebounced}
                icon="file-search-corner"
                wide
                highlight
                className="documents__search-wrap"
                inputClassName="documents__search-input"
                aria-label="Search documents"
              />
              <div className="position-relative d-inline-block">
                <Button
                  variant="outline"
                  size="md"
                  className="d-inline-flex align-items-center btn-outline-secondary"
                  onClick={handleOpenFilter}
                  aria-label={t("documents.filter", { defaultValue: "Filter" })}
                  aria-expanded={isFilterOpen}
                >
                  <Icon name="filter" className="me-1" />
                  {t("documents.filter", { defaultValue: "Filter" })}
                </Button>
                <ListFilter
                  isOpen={isFilterOpen}
                  onClose={handleCloseFilter}
                  primaryFilter={{
                    label: t("documents.department", { defaultValue: "Department" }),
                    value: draftFilters.department_id ?? null,
                    options: departmentOptions,
                    onChange: handlePrimaryFilterChange,
                  }}
                  secondaryFilter={{
                    label: t("documents.documentType", { defaultValue: "Document type" }),
                    value: draftFilters.document_type_id ?? null,
                    options: documentTypeOptions,
                    onChange: handleSecondaryFilterChange,
                  }}
                  onApply={handleApplyFilter}
                  onClear={handleClearFilter}
                  applyDisabled={filterApplyDisabled}
                  applyLabel={t("common.apply", { defaultValue: "Apply" })}
                  clearLabel={t("common.clear", { defaultValue: "Clear" })}
                  closeAriaLabel={t("common.close", { defaultValue: "Close filter" })}
                  ariaLabel={t("documents.filterOptions", { defaultValue: "Filter options" })}
                />
              </div>
              <Button variant="outline" size="md" className="d-inline-flex align-items-center btn-outline-secondary" onClick={handleOpenUpload}>
                <Icon name="file-up" className="me-2" />
                Upload Documents
              </Button>
              <Button
                variant="outline"
                size="md"
                className="d-inline-flex align-items-center btn-outline-secondary"
                onClick={handleRefresh}
                disabled={isLoading}
                aria-label="Refresh documents"
              >
                <Icon name="refresh-cw" style={{ width: "1rem", height: "1rem" }} />
              </Button>
            </div>
          </div>
          <div className="card-body">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <Button variant="outline" size="sm" className="btn-outline-secondary ms-2" onClick={handleRetry}>
                  Retry
                </Button>
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
                          <td className="Num">{doc.barcode || "-"}</td>
                          <td>{doc.document_type_name || doc.document_type?.name || "-"}</td>
                          <td>{doc.department_name || doc.department?.name || "-"}</td>
                          <td>
                            {doc.upload_date
                              ? formatRelativeTime(new Date(doc.upload_date))
                              : "-"}
                          </td>
                          <td>
                            <span className={`badge bg-${getDocumentStatusBadgeVariant(doc.status)}`}>
                              {doc.status || "unknown"}
                            </span>
                          </td>
                          <td className="text-end">
                            <Button
                              variant="light"
                              size="sm"
                              className="me-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToDocument(doc.id);
                              }}
                            >
                              View
                            </Button>
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
        onClose={handleCloseUpload}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default DocumentsPage;
