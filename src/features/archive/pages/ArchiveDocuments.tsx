import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import {
  Button,
  Alert,
  Icon,
  SearchInput,
  ListFilter,
  DataTable,
  ConfirmModal,
} from "../../../shared/components/ui";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import type { Document } from "../../../app/adapter/api/documents.api";
import { useArchivedDocumentsPageContainer } from "../../documents/containers/useArchivedDocumentsPageContainer";
import "../../documents/styles/documents.css";
import "../styles/archive.css";

const ArchiveDocuments = () => {
  const { t } = useTranslation();
  const {
    routes,
    documents,
    isLoading,
    error,
    handleSearchDebounced,
    handleNavigateToDocument,
    handleDownloadDocument,
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
    handleUnarchive,
    handlePageChange,
    pagination,
    selectedDocumentIds,
    isSomeSelected,
    selectionConfig,
    trashTargetId,
    isTrashing,
    handleOpenTrashConfirm,
    handleCloseTrashConfirm,
    handleConfirmTrash,
    isBatchTrashConfirmOpen,
    isBatchTrashing,
    handleOpenBatchTrashConfirm,
    handleCloseBatchTrashConfirm,
    handleConfirmBatchTrash,
    isBatchUnarchiveConfirmOpen,
    isBatchUnarchiving,
    handleOpenBatchUnarchiveConfirm,
    handleCloseBatchUnarchiveConfirm,
    handleConfirmBatchUnarchive,
  } = useArchivedDocumentsPageContainer();

  const totalPages = pagination?.total_pages ?? 1;
  const currentPage = pagination?.page ?? 1;
  const total = pagination?.total ?? 0;

  const columns = useMemo(
    () => [
      {
        id: "name",
        header: t("documents.name", { defaultValue: "Name" }),
        render: (row: Document) => row.name || row.title || "-",
      },
      {
        id: "barcode",
        header: t("documents.barcode", { defaultValue: "Barcode" }),
        render: (row: Document) => (
          <span className="Num">{row.barcode || "-"}</span>
        ),
      },
      {
        id: "type",
        header: t("documents.type", { defaultValue: "Type" }),
        render: (row: Document) =>
          row.document_type_name || row.document_type?.name || "-",
      },
      {
        id: "department",
        header: t("documents.department", { defaultValue: "Department" }),
        render: (row: Document) =>
          row.department_name || row.department?.name || "-",
      },
      {
        id: "uploadDate",
        header: t("documents.uploadDate", { defaultValue: "Upload Date" }),
        render: (row: Document) =>
          row.upload_date
            ? formatRelativeTime(new Date(row.upload_date))
            : "-",
      },
      {
        id: "status",
        header: t("documents.status", { defaultValue: "Status" }),
        render: (row: Document) => (
          <span
            className={`badge bg-${getDocumentStatusBadgeVariant(row.status)}`}
          >
            {row.status || "unknown"}
          </span>
        ),
      },
    ],
    [t, getDocumentStatusBadgeVariant]
  );

  const rowActions = useMemo(
    () => [
      {
        id: "view",
        label: t("common.view", { defaultValue: "View" }),
        variant: "light" as const,
        onClick: (row: Document, e: React.MouseEvent) => {
          e.stopPropagation();
          handleNavigateToDocument(row.id);
        },
      },
      {
        id: "download",
        label: t("documents.download", { defaultValue: "Download" }),
        icon: "download" as const,
        variant: "outline" as const,
        className: "btn-outline-secondary me-1",
        onClick: (row: Document, e: React.MouseEvent) => {
          e.stopPropagation();
          void handleDownloadDocument(row);
        },
      },
      {
        id: "unarchive",
        label: t("documents.unarchive", { defaultValue: "Unarchive" }),
        icon: "archive" as const,
        variant: "outline" as const,
        className: "btn-outline-secondary",
        onClick: (row: Document, e: React.MouseEvent) => {
          e.stopPropagation();
          handleUnarchive(row.id);
        },
      },
      {
        id: "trash",
        label: t("documents.moveToTrash", { defaultValue: "Move to trash" }),
        icon: "trash-2" as const,
        variant: "outline" as const,
        className: "btn-outline-danger",
        onClick: (row: Document, e: React.MouseEvent) => {
          e.stopPropagation();
          handleOpenTrashConfirm(row.id);
        },
      },
    ],
    [
      t,
      handleDownloadDocument,
      handleNavigateToDocument,
      handleUnarchive,
      handleOpenTrashConfirm,
    ]
  );

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">
              {t("dashboard.archivedDocuments", { defaultValue: "Archived Documents" })}
            </h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={routes.documents}>{t("documents.title", { defaultValue: "Documents" })}</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {t("dashboard.archivedDocuments", { defaultValue: "Archived Documents" })}
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
              <h5 className="card-title mb-0">
                {t("dashboard.archivedDocuments", { defaultValue: "Archived Documents" })}
              </h5>
              <span className="text-muted fs-13">
                {isLoading
                  ? t("common.loading", { defaultValue: "Loading..." })
                  : (total > 0 && (
                      <>
                        <span className="Num">{total}</span>{" "}
                        {total === 1
                          ? t("documents.document", { defaultValue: "document" })
                          : t("documents.documents", { defaultValue: "documents" })}
                      </>
                    )) ||
                    null}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2 documents__header-actions">
              {documents.length > 0 && isSomeSelected && (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    className="btn-outline-success d-inline-flex align-items-center me-2"
                    onClick={handleOpenBatchUnarchiveConfirm}
                    disabled={isBatchUnarchiving}
                    aria-label={t("documents.unarchiveSelected", { defaultValue: "Unarchive selected" })}
                  >
                    <Icon name="archive" className="me-1" />
                    {t("documents.unarchiveSelected", { defaultValue: "Unarchive selected" })}
                    {selectedDocumentIds.length > 0 && (
                      <span className="badge bg-success ms-2">{selectedDocumentIds.length}</span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="btn-outline-danger d-inline-flex align-items-center me-2"
                    onClick={handleOpenBatchTrashConfirm}
                    disabled={isBatchTrashing}
                    aria-label={t("documents.moveSelectedToTrash", { defaultValue: "Move selected to trash" })}
                  >
                    <Icon name="trash-2" className="me-1" />
                    {t("documents.moveSelectedToTrash", { defaultValue: "Move selected to trash" })}
                    {selectedDocumentIds.length > 0 && (
                      <span className="badge bg-danger ms-2">{selectedDocumentIds.length}</span>
                    )}
                  </Button>
                </>
              )}
              <SearchInput
                placeholder={t("documents.searchPlaceholder", { defaultValue: "Search documents..." })}
                debounceMs={300}
                onDebouncedChange={handleSearchDebounced}
                icon="file-search-corner"
                wide
                highlight
                className="documents__search-wrap"
                inputClassName="documents__search-input"
                aria-label="Search archived documents"
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
              <Link
                to={routes.documents}
                className="btn btn-outline-secondary btn-md d-inline-flex align-items-center"
              >
                <Icon name="file-check" className="me-2" />
                {t("documents.title", { defaultValue: "Documents" })}
              </Link>
              <Button
                variant="outline"
                size="md"
                className="d-inline-flex align-items-center btn-outline-secondary"
                onClick={handleRefresh}
                disabled={isLoading}
                aria-label="Refresh"
              >
                <Icon name="refresh-cw" style={{ width: "1rem", height: "1rem" }} />
              </Button>
            </div>
          </div>
          <div className="card-body h-50vh">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-outline-secondary ms-2"
                  onClick={handleRetry}
                >
                  {t("common.retry", { defaultValue: "Retry" })}
                </Button>
              </Alert>
            )}
            <DataTable<Document>
              data={documents}
              getRowId={(row) => row.id}
              columns={columns}
              loading={isLoading}
              emptyMessage={t("documents.noDocumentsFound", { defaultValue: "No documents found" })}
              onRowClick={(row) => handleNavigateToDocument(row.id)}
              rowActions={rowActions}
              selection={selectionConfig}
              actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
            />
            {!isLoading && totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
                <span className="text-muted small">
                  {t("documents.pageInfo", {
                    defaultValue: "Page {{page}} of {{total}}",
                    page: currentPage,
                    total: totalPages,
                  })}
                </span>
                <div className="d-flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    {t("common.previous", { defaultValue: "Previous" })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    {t("common.next", { defaultValue: "Next" })}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={trashTargetId != null}
        onClose={handleCloseTrashConfirm}
        onConfirm={handleConfirmTrash}
        title={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        message={t("documents.confirmMoveToTrash", {
          defaultValue: "Are you sure you want to move this document to trash?",
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
        isLoading={isTrashing}
      />

      <ConfirmModal
        isOpen={isBatchTrashConfirmOpen}
        onClose={handleCloseBatchTrashConfirm}
        onConfirm={handleConfirmBatchTrash}
        title={t("documents.moveSelectedToTrash", { defaultValue: "Move selected to trash" })}
        message={t("documents.confirmBatchMoveToTrash", {
          defaultValue: "Move {{count}} document(s) to trash?",
          count: selectedDocumentIds.length,
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
        isLoading={isBatchTrashing}
      />

      <ConfirmModal
        isOpen={isBatchUnarchiveConfirmOpen}
        onClose={handleCloseBatchUnarchiveConfirm}
        onConfirm={handleConfirmBatchUnarchive}
        title={t("documents.unarchiveSelected", { defaultValue: "Unarchive selected" })}
        message={t("documents.confirmBatchUnarchive", {
          defaultValue: "Unarchive {{count}} document(s)?",
          count: selectedDocumentIds.length,
        })}
        confirmLabel={t("documents.unarchive", { defaultValue: "Unarchive" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="primary"
        isLoading={isBatchUnarchiving}
      />
    </div>
  );
};

export default ArchiveDocuments;
