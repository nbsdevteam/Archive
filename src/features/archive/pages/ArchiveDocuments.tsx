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
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useConfirmDialog, useConfirmDialogEmpty } from "../../../shared/hooks";
import type { Document } from "../../../app/adapter/api/documents.api";
import { buildRowActions } from "../../../shared/utils/buildRowActions";
import { useArchivedDocumentsPageContainer } from "../../documents/containers/useArchivedDocumentsPageContainer";
import { getDocumentTableColumns } from "../../documents/utils/documentTableColumns";
import "../../documents/styles/documents.css";
import "../styles/archive.css";

const ArchiveDocuments = () => {
  const { t } = useTranslation();
  const { data, loading, error, filter, selection, paging, actions, modals } = useArchivedDocumentsPageContainer();
  const { documents, pagination, routes } = data;
  const { selectedDocumentIds, selectionConfig, isSomeSelected } = selection;

  const trashDialog = useConfirmDialog<number>({ onConfirm: actions.confirmTrash });
  const batchTrashDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchTrash });
  const batchUnarchiveDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchUnarchive });

  const totalPages = pagination?.total_pages ?? 1;
  const currentPage = pagination?.page ?? 1;
  const total = pagination?.total ?? 0;

  const columns = useMemo(
    () =>
      getDocumentTableColumns({
        t,
        getDocumentStatusBadgeVariant: actions.getDocumentStatusBadgeVariant,
      }),
    [t, actions.getDocumentStatusBadgeVariant]
  );

  const rowActions = useMemo(
    () =>
      buildRowActions<Document>(t, [
        {
          id: "view",
          labelKey: "common.view",
          defaultValue: "View",
          variant: "light",
          onClick: (row) => actions.handleNavigateToDocument(row.id),
        },
        {
          id: "download",
          labelKey: "documents.download",
          defaultValue: "Download",
          icon: "download",
          variant: "outline",
          className: "btn-outline-secondary me-1",
          onClick: (row) => void actions.handleDownloadDocument(row),
        },
        {
          id: "unarchive",
          labelKey: "documents.unarchive",
          defaultValue: "Unarchive",
          icon: "archive",
          variant: "outline",
          className: "btn-outline-secondary",
          onClick: (row) => actions.handleUnarchive(row.id),
        },
        {
          id: "trash",
          labelKey: "documents.moveToTrash",
          defaultValue: "Move to trash",
          icon: "trash-2",
          variant: "outline",
          className: "btn-outline-danger",
          onClick: (row) => trashDialog.open(row.id),
        },
      ]),
    [
      t,
      actions.handleDownloadDocument,
      actions.handleNavigateToDocument,
      actions.handleUnarchive,
      trashDialog.open,
    ]
  );

  const pageTitle = t("dashboard.archivedDocuments", { defaultValue: "Archived Documents" });

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[{ label: t("documents.title", { defaultValue: "Documents" }), to: routes.documents }]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card documents__table-card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0">
                {t("dashboard.archivedDocuments", { defaultValue: "Archived Documents" })}
              </h5>
              <span className="text-muted fs-13">
                {loading
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
                    onClick={batchUnarchiveDialog.open}
                    disabled={modals.isUnarchiving}
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
                    onClick={batchTrashDialog.open}
                    disabled={modals.isTrashing}
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
                onDebouncedChange={filter.handleSearchDebounced}
                icon="file-search-corner"
                wide
                highlight
                className="documents__search-wrap"
                inputClassName="documents__search-input"
                aria-label={t("documents.searchAria", { defaultValue: "Search archived documents" })}
              />
              <div className="position-relative d-inline-block">
                <Button
                  variant="outline"
                  size="md"
                  className="d-inline-flex align-items-center btn-outline-secondary"
                  onClick={filter.handleOpenFilter}
                  aria-label={t("documents.filter", { defaultValue: "Filter" })}
                  aria-expanded={filter.isFilterOpen}
                >
                  <Icon name="filter" className="me-1" />
                  {t("documents.filter", { defaultValue: "Filter" })}
                </Button>
                <ListFilter
                  isOpen={filter.isFilterOpen}
                  onClose={filter.handleCloseFilter}
                  primaryFilter={{
                    label: t("documents.department", { defaultValue: "Department" }),
                    value: filter.draftFilters.department_id ?? null,
                    options: filter.departmentOptions,
                    onChange: filter.handlePrimaryFilterChange,
                  }}
                  secondaryFilter={{
                    label: t("documents.documentType", { defaultValue: "Document type" }),
                    value: filter.draftFilters.document_type_id ?? null,
                    options: filter.documentTypeOptions,
                    onChange: filter.handleSecondaryFilterChange,
                  }}
                  onApply={filter.handleApplyFilter}
                  onClear={filter.handleClearFilter}
                  applyDisabled={filter.filterApplyDisabled}
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
                onClick={actions.handleRefresh}
                disabled={loading}
                aria-label={t("documents.refreshAria", { defaultValue: "Refresh" })}
              >
                <Icon name="refresh-cw" style={{ width: "1rem", height: "1rem" }} />
              </Button>
            </div>
          </div>
          <div className="card-body h-min-50vh">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-outline-secondary ms-2"
                  onClick={actions.handleRetry}
                >
                  {t("common.retry", { defaultValue: "Retry" })}
                </Button>
              </Alert>
            )}
            <DataTable<Document>
              data={documents}
              getRowId={(row) => row.id}
              columns={columns}
              loading={loading}
              emptyMessage={t("documents.noDocumentsFound", { defaultValue: "No documents found" })}
              onRowClick={(row) => actions.handleNavigateToDocument(row.id)}
              rowActions={rowActions}
              selection={selectionConfig}
              actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
            />
            {!loading && totalPages > 1 && (
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
                    onClick={() => paging.handlePageChange(currentPage - 1)}
                  >
                    {t("common.previous", { defaultValue: "Previous" })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => paging.handlePageChange(currentPage + 1)}
                  >
                    {t("common.next", { defaultValue: "Next" })}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

      <ConfirmModal
        {...trashDialog.modalProps}
        title={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        message={t("documents.confirmMoveToTrash", {
          defaultValue: "Are you sure you want to move this document to trash?",
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...batchTrashDialog.modalProps}
        title={t("documents.moveSelectedToTrash", { defaultValue: "Move selected to trash" })}
        message={t("documents.confirmBatchMoveToTrash", {
          defaultValue: "Move {{count}} document(s) to trash?",
          count: selectedDocumentIds.length,
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...batchUnarchiveDialog.modalProps}
        title={t("documents.unarchiveSelected", { defaultValue: "Unarchive selected" })}
        message={t("documents.confirmBatchUnarchive", {
          defaultValue: "Unarchive {{count}} document(s)?",
          count: selectedDocumentIds.length,
        })}
        confirmLabel={t("documents.unarchive", { defaultValue: "Unarchive" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="primary"
      />
    </PageLayout>
  );
};

export default ArchiveDocuments;
