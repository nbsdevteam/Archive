import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { UploadDocumentSidePanel } from "../components";
import { TransferToFolderModal } from "../../folders/components";
import { Button, Alert, Icon, SearchInput, ListFilter, DataTable, ConfirmModal } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import type { Document } from "../../../app/adapter/api/documents.api";
import { useDocumentsPageContainer } from "../containers/useDocumentsPageContainer";
import { getDocumentTableColumns } from "../utils/documentTableColumns";
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
    handleDownloadDocument,
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
    trashTargetId,
    isTrashing,
    handleOpenTrashConfirm,
    handleCloseTrashConfirm,
    handleConfirmTrash,
    archiveTargetId,
    isArchiving,
    handleOpenArchiveConfirm,
    handleCloseArchiveConfirm,
    handleConfirmArchive,
    isBatchArchiveConfirmOpen,
    isBatchArchiving,
    handleOpenBatchArchiveConfirm,
    handleCloseBatchArchiveConfirm,
    handleConfirmBatchArchive,
    selectedDocumentIds,
    isSomeSelected,
    selectionConfig,
    isBatchTrashConfirmOpen,
    isBatchTrashing,
    handleOpenBatchTrashConfirm,
    handleCloseBatchTrashConfirm,
    handleConfirmBatchTrash,
    isMoveModalOpen,
    moveDocumentIdsCount,
    moveDepartmentId,
    isMoveSubmitting,
    handleOpenSingleMoveConfirm,
    handleOpenBatchMoveConfirm,
    handleCloseBatchMoveConfirm,
    handleConfirmBatchMove,
  } = useDocumentsPageContainer();

  const columns = useMemo(
    () =>
      getDocumentTableColumns({
        t,
        getDocumentStatusBadgeVariant,
      }),
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
        id: "transfer",
        label: t("documents.transfer", { defaultValue: "Transfer to folder" }),
        icon: "arrow-right-left" as const,
        variant: "outline" as const,
        className: "btn-outline-secondary me-1",
        onClick: (row: Document, e: React.MouseEvent) => {
          e.stopPropagation();
          handleOpenSingleMoveConfirm(row.id);
        },
      },
      {
        id: "archive",
        label: t("documents.archive", { defaultValue: "Archive" }),
        icon: "archive" as const,
        variant: "outline" as const,
        className: "btn-outline-secondary me-1",
        visible: (row: Document) =>
          (row.status ?? "").toLowerCase() === "active",
        onClick: (row: Document, e: React.MouseEvent) => {
          e.stopPropagation();
          handleOpenArchiveConfirm(row.id);
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
      handleOpenSingleMoveConfirm,
      handleOpenArchiveConfirm,
      handleOpenTrashConfirm,
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
                {isLoading
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
                    onClick={handleOpenBatchMoveConfirm}
                    disabled={isMoveSubmitting}
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
                    onClick={handleOpenBatchArchiveConfirm}
                    disabled={isBatchArchiving}
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
                aria-label={t("documents.searchAria", { defaultValue: "Search documents" })}
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
                onClick={handleRefresh}
                disabled={isLoading}
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
                <Button variant="outline" size="sm" className="btn-outline-secondary ms-2" onClick={handleRetry}>
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
          </div>
        </div>

      <UploadDocumentSidePanel
        isOpen={isUploadOpen}
        onClose={handleCloseUpload}
        onSuccess={handleUploadSuccess}
      />

      <ConfirmModal
        isOpen={trashTargetId != null}
        onClose={handleCloseTrashConfirm}
        onConfirm={handleConfirmTrash}
        title={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        message={t("documents.confirmMoveToTrash", { defaultValue: "Are you sure you want to move this document to trash?" })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
        isLoading={isTrashing}
      />

      <ConfirmModal
        isOpen={archiveTargetId != null}
        onClose={handleCloseArchiveConfirm}
        onConfirm={handleConfirmArchive}
        title={t("documents.archive", { defaultValue: "Archive" })}
        message={t("documents.confirmArchive", { defaultValue: "Are you sure you want to archive this document?" })}
        confirmLabel={t("documents.archive", { defaultValue: "Archive" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="secondary"
        isLoading={isArchiving}
      />

      <ConfirmModal
        isOpen={isBatchArchiveConfirmOpen}
        onClose={handleCloseBatchArchiveConfirm}
        onConfirm={handleConfirmBatchArchive}
        title={t("documents.archiveSelected", { defaultValue: "Archive selected" })}
        message={t("documents.confirmBatchArchive", {
          defaultValue: "Archive {{count}} document(s)?",
          count: selectedDocumentIds.length,
        })}
        confirmLabel={t("documents.archive", { defaultValue: "Archive" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="secondary"
        isLoading={isBatchArchiving}
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

      <TransferToFolderModal
        isOpen={isMoveModalOpen}
        onClose={handleCloseBatchMoveConfirm}
        departmentId={moveDepartmentId}
        title={t("documents.transferToFolder", { defaultValue: "Transfer to folder" })}
        subtitle={t("documents.transferSubtitle", {
          defaultValue: "Transfer {{count}} document(s) to a folder in the same department.",
          count: moveDocumentIdsCount,
        })}
        onConfirm={handleConfirmBatchMove}
        isSubmitting={isMoveSubmitting}
      />
    </PageLayout>
  );
};

export default DocumentsPage;
