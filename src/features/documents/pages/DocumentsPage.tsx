import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { UploadDocumentSidePanel } from "../components";
import { TransferToFolderModal } from "../../folders/components";
import { Button, Alert, Icon, SearchInput, ListFilter, DataTable, ConfirmModal } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useConfirmDialog, useConfirmDialogEmpty } from "../../../shared/hooks";
import type { Document } from "../../../app/adapter/api/documents.api";
import { buildRowActions } from "../../../shared/utils/buildRowActions";
import { useDocumentsPageContainer } from "../containers/useDocumentsPageContainer";
import { getDocumentTableColumns } from "../utils/documentTableColumns";
import "../styles/documents.css";

/**
 * DocumentsPage - Documents management page with search and table.
 * Uses useConfirmDialog for single/batch trash and archive modals (DRY).
 */
const DocumentsPage = () => {
  const { t } = useTranslation();
  const { data, loading, error, filter, selection, actions, modals } = useDocumentsPageContainer();
  const { documents, routes } = data;
  const { selectedDocumentIds, selectionConfig, isSomeSelected } = selection;

  const trashDialog = useConfirmDialog<number>({ onConfirm: actions.confirmTrash });
  const archiveDialog = useConfirmDialog<number>({ onConfirm: actions.confirmArchive });
  const batchTrashDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchTrash });
  const batchArchiveDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchArchive });

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
          id: "transfer",
          labelKey: "documents.transfer",
          defaultValue: "Transfer to folder",
          icon: "arrow-right-left",
          variant: "outline",
          className: "btn-outline-secondary me-1",
          onClick: (row) => actions.handleOpenSingleMoveConfirm(row.id),
        },
        {
          id: "archive",
          labelKey: "documents.archive",
          defaultValue: "Archive",
          icon: "archive",
          variant: "outline",
          className: "btn-outline-secondary me-1",
          visible: (row) => (row.status ?? "").toLowerCase() === "active",
          onClick: (row) => archiveDialog.open(row.id),
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
      actions.handleOpenSingleMoveConfirm,
      archiveDialog.open,
      trashDialog.open,
    ]
  );

  const pageTitle = t("documents.title", { defaultValue: "Documents" });

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card documents__table-card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0">{t("documents.title", { defaultValue: "Documents" })}</h5>
              <span className="text-muted fs-13">
                {loading
                  ? t("common.loading", { defaultValue: "Loading..." })
                  : (documents?.length != null && (
                      <>
                        <span className="Num">{documents.length}</span>{" "}
                        {documents.length === 1
                          ? t("documents.document", { defaultValue: "document" })
                          : t("documents.documents", { defaultValue: "documents" })}
                      </>
                    )) || null}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2 documents__header-actions">
              {documents.length > 0 && isSomeSelected && (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    className="btn-outline-secondary d-inline-flex align-items-center me-2"
                    onClick={actions.handleOpenBatchMoveConfirm}
                    disabled={modals.isMoveSubmitting || modals.isTrashing || modals.isArchiving}
                    aria-label={t("documents.transferSelected", { defaultValue: "Transfer selected" })}
                  >
                    <Icon name="arrow-right-left" className="me-1" />
                    {t("documents.transferSelected", { defaultValue: "Transfer selected" })}
                    {selectedDocumentIds.length > 0 && (
                      <span className="badge bg-secondary ms-2">{selectedDocumentIds.length}</span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="btn-outline-secondary d-inline-flex align-items-center me-2"
                    onClick={batchArchiveDialog.open}
                    disabled={modals.isArchiving}
                    aria-label={t("documents.archiveSelected", { defaultValue: "Archive selected" })}
                  >
                    <Icon name="archive" className="me-1" />
                    {t("documents.archiveSelected", { defaultValue: "Archive selected" })}
                    {selectedDocumentIds.length > 0 && (
                      <span className="badge bg-secondary ms-2">{selectedDocumentIds.length}</span>
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
                aria-label={t("documents.searchAria", { defaultValue: "Search documents" })}
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
              <Button variant="outline" size="md" className="d-inline-flex align-items-center btn-outline-secondary" onClick={actions.handleOpenUpload}>
                <Icon name="file-up" className="me-2" />
                {t("documents.uploadDocuments", { defaultValue: "Upload Documents" })}
              </Button>
              <Link to={routes.documentsTrash} className="btn btn-outline-secondary btn-md d-inline-flex align-items-center">
                <Icon name="trash" className="me-2" />
                {t("documents.trashView", { defaultValue: "Trash" })}
              </Link>
              <Button
                variant="outline"
                size="md"
                className="d-inline-flex align-items-center btn-outline-secondary"
                onClick={actions.handleRefresh}
                disabled={loading}
                aria-label={t("documents.refreshAria", { defaultValue: "Refresh documents" })}
              >
                <Icon name="refresh-cw" style={{ width: "1rem", height: "1rem" }} />
              </Button>
            </div>
          </div>
          <div className="card-body h-min-50vh">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <Button variant="outline" size="sm" className="btn-outline-secondary ms-2" onClick={actions.handleRetry}>
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
          </div>
        </div>

      <UploadDocumentSidePanel
        isOpen={modals.isUploadOpen}
        onClose={actions.handleCloseUpload}
        onSuccess={actions.handleUploadSuccess}
      />

      <ConfirmModal
        {...trashDialog.modalProps}
        title={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        message={t("documents.confirmMoveToTrash", { defaultValue: "Are you sure you want to move this document to trash?" })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...archiveDialog.modalProps}
        title={t("documents.archive", { defaultValue: "Archive" })}
        message={t("documents.confirmArchive", { defaultValue: "Are you sure you want to archive this document?" })}
        confirmLabel={t("documents.archive", { defaultValue: "Archive" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="secondary"
      />

      <ConfirmModal
        {...batchArchiveDialog.modalProps}
        title={t("documents.archiveSelected", { defaultValue: "Archive selected" })}
        message={t("documents.confirmBatchArchive", {
          defaultValue: "Archive {{count}} document(s)?",
          count: selectedDocumentIds.length,
        })}
        confirmLabel={t("documents.archive", { defaultValue: "Archive" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="secondary"
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

      <TransferToFolderModal
        isOpen={modals.isMoveModalOpen}
        onClose={actions.handleCloseBatchMoveConfirm}
        departmentId={modals.moveDepartmentId}
        title={t("documents.transferToFolder", { defaultValue: "Transfer to folder" })}
        subtitle={t("documents.transferSubtitle", {
          defaultValue: "Transfer {{count}} document(s) to a folder in the same department.",
          count: modals.moveDocumentIdsCount,
        })}
        onConfirm={actions.handleConfirmBatchMove}
        isSubmitting={modals.isMoveSubmitting}
      />
    </PageLayout>
  );
};

export default DocumentsPage;
