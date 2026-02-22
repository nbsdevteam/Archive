import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { Alert, Button, DataTable, ConfirmModal, Icon, SearchInput, MobileActionsMenu } from "@/shared/components/ui";
import type { MobileActionsMenuItem } from "@/shared/components/ui";
import { PaginationSection } from "@/shared/components/PaginationSection";
import { PageLayout } from "@/shared/layout/PageLayout";
import { TablePageToolbar } from "@/shared/components/TablePageToolbar";
import { useConfirmDialog, useConfirmDialogEmpty } from "@/shared/hooks";
import { useViewport } from "@/shared/hooks/useViewport";
import type { Document } from "@/app/adapter/api/documents.api";
import { buildRowActions } from "@/shared/utils/buildRowActions";
import { useArchivedDocumentsPageContainer } from "@/features/documents/containers/useArchivedDocumentsPageContainer";
import { useDocumentsTableSort } from "@/features/documents/hooks/useDocumentsTableSort";
import { getDocumentTableColumns } from "@/features/documents/utils/documentTableColumns";
import "@/features/documents/styles/documents.css";

/**
 * Archived documents list page. Uses useArchivedDocumentsPageContainer for
 * status=archived list with search, filter, selection, unarchive and trash actions.
 */
const ArchivedDocumentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobileView } = useViewport();
  const { data, loading, error, filter, selection, actions, modals, paging } =
    useArchivedDocumentsPageContainer();
  const { documents, routes, pagination } = data;
  const { handlePageChange, handlePerPageChange } = paging;
  const { selectedDocumentIds, selectionConfig, isSomeSelected, batchActions } = selection;
  const { sortedDocuments, onSortClick, getSortIconForColumn } = useDocumentsTableSort(documents);

  const unarchiveDialog = useConfirmDialog<number>({ onConfirm: actions.handleUnarchive });
  const batchUnarchiveDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchUnarchive });
  const trashDialog = useConfirmDialog<number>({ onConfirm: actions.confirmTrash });
  const batchTrashDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchTrash });

  const columns = useMemo(
    () =>
      getDocumentTableColumns({
        t,
        getDocumentStatusBadgeVariant: actions.getDocumentStatusBadgeVariant,
        sort: { onSortClick, getSortIconForColumn },
      }),
    [t, actions.getDocumentStatusBadgeVariant, onSortClick, getSortIconForColumn]
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
          className: "btn-outline-secondary me-1",
          onClick: (row) => unarchiveDialog.open(row.id),
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
      actions.handleNavigateToDocument,
      actions.handleDownloadDocument,
      unarchiveDialog.open,
      trashDialog.open,
    ]
  );

  const countSlot =
    loading
      ? t("common.loading", { defaultValue: "Loading..." })
      : (documents?.length != null && (
          <>
            <span className="Num">{documents.length}</span>
            {pagination?.total != null && pagination.total !== documents.length && (
              <> / {pagination.total}</>
            )}{" "}
            {documents.length === 1
              ? t("documents.document", { defaultValue: "document" })
              : t("documents.documents", { defaultValue: "documents" })}
          </>
        )) || null;

  const desktopToolbar = (
    <TablePageToolbar
      title={
        <h5 className="card-title mb-0">
          {t("documents.archivedDocuments", { defaultValue: "Archived documents" })}
        </h5>
      }
      countSlot={countSlot}
      rightClassName="documents__header-actions"
    >
      {documents.length > 0 && isSomeSelected && (
        <>
          {batchActions.canBatchUnarchive && (
            <Button
              variant="outline"
              size="md"
              className="btn-outline-secondary d-inline-flex align-items-center me-2"
              onClick={batchUnarchiveDialog.open}
              disabled={modals.isUnarchiving}
              aria-label={t("documents.unarchiveSelected", { defaultValue: "Unarchive selected" })}
              data-testid="archived-unarchive-selected"
            >
              <Icon name="archive" className="me-1" />
              {t("documents.unarchiveSelected", { defaultValue: "Unarchive selected" })}
              {selectedDocumentIds.length > 0 && (
                <span className="badge bg-secondary ms-2">{selectedDocumentIds.length}</span>
              )}
            </Button>
          )}
          {batchActions.canBatchTrash && (
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
          )}
        </>
      )}
      <div data-testid="archived-documents-search">
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
      </div>
      <Link
        to={routes.documentsTrash}
        className="btn btn-outline-secondary control-height-md d-inline-flex align-items-center"
        aria-label={t("documents.trashViewAria", { defaultValue: "View trash" })}
      >
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
        <Icon name="refresh-cw" className="me-1" />
        {t("common.refresh", { defaultValue: "Refresh" })}
      </Button>
    </TablePageToolbar>
  );

  const mobileMenuItems: MobileActionsMenuItem[] = [
    {
      id: "trash",
      icon: "trash",
      label: t("documents.trashView", { defaultValue: "Trash" }),
      onClick: () => navigate(routes.documentsTrash),
    },
    {
      id: "refresh",
      icon: "refresh-cw",
      label: t("common.refresh", { defaultValue: "Refresh" }),
      disabled: loading,
      onClick: actions.handleRefresh,
    },
  ];
  if (documents.length > 0 && isSomeSelected) {
    if (batchActions.canBatchUnarchive) {
      mobileMenuItems.push({
        id: "unarchive",
        icon: "archive",
        label: t("documents.unarchiveSelected", { defaultValue: "Unarchive selected" }),
        badgeCount: selectedDocumentIds.length,
        onClick: batchUnarchiveDialog.open,
        disabled: modals.isUnarchiving,
      });
    }
    if (batchActions.canBatchTrash) {
      mobileMenuItems.push({
        id: "trash-selected",
        icon: "trash-2",
        label: t("documents.moveSelectedToTrash", { defaultValue: "Move selected to trash" }),
        badgeCount: selectedDocumentIds.length,
        variant: "danger",
        onClick: batchTrashDialog.open,
        disabled: modals.isTrashing,
      });
    }
  }

  const mobileToolbar = (
    <div className="card-header d-flex flex-column gap-2">
      <div className="d-flex align-items-center gap-2">
        <h5 className="card-title mb-0">
          {t("documents.archivedDocuments", { defaultValue: "Archived documents" })}
        </h5>
        {countSlot != null && <span className="text-muted fs-13">{countSlot}</span>}
      </div>
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <MobileActionsMenu
          title={t("common.actions", { defaultValue: "Actions" })}
          items={mobileMenuItems}
          triggerAriaLabel={t("common.actions", { defaultValue: "Actions" })}
        />
      </div>
      <div className="w-100" data-testid="archived-documents-search">
        <SearchInput
          placeholder={t("documents.searchPlaceholder", { defaultValue: "Search documents..." })}
          debounceMs={300}
          onDebouncedChange={filter.handleSearchDebounced}
          icon="file-search-corner"
          wide
          highlight
          className="w-100"
          inputClassName="documents__search-input"
          aria-label={t("documents.searchAria", { defaultValue: "Search documents" })}
        />
      </div>
    </div>
  );

  return (
    <PageLayout
      title={t("documents.archivedDocuments", { defaultValue: "Archived documents" })}
      breadcrumbItems={[{ label: t("documents.title", { defaultValue: "Documents" }), to: routes.documents }]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
      <div className="card documents__table-card" data-testid="archived-documents-page">
        {isMobileView ? mobileToolbar : desktopToolbar}
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
            data={sortedDocuments}
            getRowId={(row) => row.id}
            columns={columns}
            loading={loading}
            emptyMessage={t("documents.noDocumentsFound", { defaultValue: "No documents found" })}
            onRowClick={(row) => actions.handleNavigateToDocument(row.id)}
            rowActions={rowActions}
            selection={selectionConfig}
            actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
          />
          {pagination && (pagination.total_pages > 0 || (pagination.total ?? 0) > 0) && (
            <PaginationSection
              page={pagination.page ?? 1}
              perPage={pagination.per_page ?? 20}
              total={pagination.total}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
              disabled={loading}
            />
          )}
        </div>
      </div>

      <ConfirmModal
        {...unarchiveDialog.modalProps}
        title={t("documents.unarchive", { defaultValue: "Unarchive" })}
        message={t("documents.confirmUnarchive", { defaultValue: "Unarchive this document?" })}
        confirmLabel={t("documents.unarchive", { defaultValue: "Unarchive" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="secondary"
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
        confirmVariant="secondary"
      />
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
    </PageLayout>
  );
};

export default ArchivedDocumentsPage;
