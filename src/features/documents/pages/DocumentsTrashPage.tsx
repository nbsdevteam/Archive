import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { Alert, Icon, DataTable, ConfirmModal, Spinner, Button, MobileActionsMenu } from "@/shared/components/ui";
import { ListFilter } from "@/shared/components/ui/ListFilter";
import { PaginationSection } from "@/shared/components/PaginationSection";
import { PageLayout } from "@/shared/layout/PageLayout";
import { useConfirmDialog, useConfirmDialogEmpty } from "@/shared/hooks";
import { useViewport } from "@/shared/hooks/useViewport";
import { buildRowActions } from "@/shared/utils/buildRowActions";
import { useDocumentsTrashPageContainer } from "@/features/documents/containers/useDocumentsTrashPageContainer";
import {
  getDocumentTableColumnsForTrash,
  type TrashDocument,
} from "@/features/documents/utils/documentTableColumns";
import "@/features/documents/styles/documents.css";

const DocumentsTrashPage = () => {
  const { t } = useTranslation();
  const { isMobileView } = useViewport();
  const { data, loading, error, selection, actions, modals, filter } = useDocumentsTrashPageContainer();
  const { routes, documents, pagination, isAdmin } = data;
  const { selectedDocumentIds, isSomeSelected, selectionConfig, batchActions } = selection;
  const { isRestoring, isPermanentDeleting } = modals;

  const permanentDeleteDialog = useConfirmDialog<number>({ onConfirm: actions.confirmPermanentDelete });
  const batchRestoreDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchRestore });
  const batchPermanentDeleteDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchPermanentDelete });

  const columns = useMemo(
    () => getDocumentTableColumnsForTrash({ t }),
    [t]
  );

  const rowActions = useMemo(
    () =>
      buildRowActions<TrashDocument>(t, [
        {
          id: "restore",
          labelKey: "documents.restore",
          defaultValue: "Restore",
          variant: "outline",
          className: "btn-outline-secondary me-1",
          disabled: (row) => modals.restoreLoadingId === row.id,
          renderLabel: (row) =>
            modals.restoreLoadingId === row.id ? (
              <>
                <Spinner size="sm" />
                {t("documents.restore", { defaultValue: "Restore" })}
              </>
            ) : (
              t("documents.restore", { defaultValue: "Restore" })
            ),
          onClick: (row) => actions.handleRestore(row.id),
        },
        {
          id: "permanentDelete",
          labelKey: "documents.permanentDelete",
          defaultValue: "Permanent delete",
          icon: "trash",
          variant: "outline",
          className: "btn-outline-danger",
          visible: () => data.isAdmin,
          onClick: (row) => permanentDeleteDialog.open(row.id),
        },
      ]),
    [t, data.isAdmin, modals.restoreLoadingId, actions.handleRestore, permanentDeleteDialog.open]
  );

  const pageTitle = t("documents.trashView", { defaultValue: "Trash" });

  const countEl = (
    <span className="text-muted fs-13">
      {loading ? t("common.loading", { defaultValue: "Loading..." }) : (
        <>
          <span className="Num">{documents.length}</span>
          {pagination && pagination.total > documents.length && (
            <> / {pagination.total}</>
          )}{" "}
          {documents.length === 1
            ? t("documents.document", { defaultValue: "document" })
            : t("documents.documents", { defaultValue: "documents" })}
        </>
      )}
    </span>
  );

  const filterBlock = (
    <div className="position-relative d-inline-block">
      <Button
        variant="outline"
        size="md"
        className="btn-outline-secondary d-inline-flex align-items-center"
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
        dateRange={{
          label: t("filter.byDate", { defaultValue: "By Date" }),
          mode: filter.dateRangeMode,
          fromDate: filter.dateRangeFromDate,
          toDate: filter.dateRangeToDate,
          onModeChange: filter.handleDateRangeModeChange,
          onDatesChange: filter.handleDateRangeChange,
          onCancel: filter.hasAppliedDateFilter ? filter.handleCancelFilter : undefined,
          cancelLabel: t("common.cancel", { defaultValue: "Cancel" }),
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
  );

  const batchActionsJsx = isSomeSelected && (
    <>
      {batchActions.canBatchRestore && (
        <Button
          variant="outline"
          size="md"
          className="btn-outline-secondary d-inline-flex align-items-center"
          onClick={batchRestoreDialog.open}
          disabled={isRestoring}
          aria-label={t("documents.restoreSelected", { defaultValue: "Restore selected" })}
          data-testid="trash-restore-selected"
        >
          <Icon name="refresh-cw" className="me-1" />
          {t("documents.restoreSelected", { defaultValue: "Restore selected" })}
          {selectedDocumentIds.length > 0 && (
            <span className="badge bg-secondary ms-2">{selectedDocumentIds.length}</span>
          )}
        </Button>
      )}
      {isAdmin && (
        <Button
          variant="outline"
          size="md"
          className="btn-outline-danger d-inline-flex align-items-center"
          onClick={batchPermanentDeleteDialog.open}
          disabled={isPermanentDeleting}
          aria-label={t("documents.permanentDeleteSelected", { defaultValue: "Permanent delete selected" })}
        >
          <Icon name="trash" className="me-1" />
          {t("documents.permanentDeleteSelected", { defaultValue: "Permanent delete selected" })}
          {selectedDocumentIds.length > 0 && (
            <span className="badge bg-danger ms-2">{selectedDocumentIds.length}</span>
          )}
        </Button>
      )}
    </>
  );

  /** Mobile-only: "Actions on selected" kebab always on same row as Filter; menu shows Restore + Delete with badge (0 when none selected). */
  const mobileActionsMenuItems = [
    ...(batchActions.canBatchRestore
      ? [
          {
            id: "restore",
            icon: "refresh-cw" as const,
            label: t("documents.restoreSelected", { defaultValue: "Restore selected" }),
            description: t("documents.restoreSelectedDescription", { defaultValue: "Move back to Documents" }),
            badgeCount: selectedDocumentIds.length,
            onClick: batchRestoreDialog.open,
            disabled: isRestoring || !isSomeSelected,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: "delete",
            icon: "trash" as const,
            label: t("documents.deleteSelected", { defaultValue: "Delete selected" }),
            description: t("documents.permanentDeleteDescription", { defaultValue: "This cannot be undone" }),
            badgeCount: selectedDocumentIds.length,
            variant: "danger" as const,
            onClick: batchPermanentDeleteDialog.open,
            disabled: isPermanentDeleting || !isSomeSelected,
          },
        ]
      : []),
  ];

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[{ label: t("documents.title", { defaultValue: "Documents" }), to: routes.documents }]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card documents__table-card" data-testid="documents-trash-page">
          {isMobileView ? (
            <div className="card-header d-flex flex-column gap-2">
              <div className="d-flex align-items-center gap-2">
                <h5 className="card-title mb-0">{t("documents.trashView", { defaultValue: "Trash" })}</h5>
                {countEl}
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
                {filterBlock}
                <MobileActionsMenu
                  title={t("documents.actionsOnSelected", { defaultValue: "Actions on selected" })}
                  items={mobileActionsMenuItems}
                  triggerAriaLabel={t("documents.actionsOnSelected", { defaultValue: "Actions on selected" })}
                />
              </div>
            </div>
          ) : (
            <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <h5 className="card-title mb-0">{t("documents.trashView", { defaultValue: "Trash" })}</h5>
                {countEl}
              </div>
              <div className="d-flex align-items-center gap-2 documents-trash__header-actions">
                {filterBlock}
                {batchActionsJsx}
              </div>
            </div>
          )}
          <div className="card-body h-min-50vh">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}
            <DataTable<TrashDocument>
              data={documents}
              getRowId={(row) => row.id}
              columns={columns}
              loading={loading}
              emptyMessage={t("common.noData", { defaultValue: "No data" })}
              rowActions={rowActions}
              selection={data.isAdmin ? selectionConfig : undefined}
              actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
            />
          </div>
          {/* Generic pagination: same component and layout as Documents page (per-page + First/Prev/numbers/Next/Last). */}
          {pagination && (pagination.total_pages > 0 || (pagination.total ?? 0) > 0) && (
            <PaginationSection
              page={pagination.page ?? 1}
              perPage={pagination.per_page ?? 20}
              total={pagination.total}
              totalPages={pagination.total_pages}
              onPageChange={actions.handlePageChange}
              onPerPageChange={actions.handlePerPageChange}
              disabled={loading}
            />
          )}
        </div>

        <ConfirmModal
          {...permanentDeleteDialog.modalProps}
          title={t("documents.permanentDelete", { defaultValue: "Permanent delete" })}
          message={t("documents.confirmPermanentDelete", { defaultValue: "This will permanently delete the document. This action cannot be undone." })}
          confirmLabel={t("documents.permanentDelete", { defaultValue: "Permanent delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          confirmVariant="danger"
        />

        <ConfirmModal
          {...batchRestoreDialog.modalProps}
          title={t("documents.restoreSelected", { defaultValue: "Restore selected" })}
          message={t("documents.confirmBatchRestore", {
            defaultValue: "Restore {{count}} document(s)?",
            count: selectedDocumentIds.length,
          })}
          confirmLabel={t("documents.restore", { defaultValue: "Restore" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          confirmVariant="secondary"
        />

        <ConfirmModal
          {...batchPermanentDeleteDialog.modalProps}
          title={t("documents.permanentDeleteSelected", { defaultValue: "Permanent delete selected" })}
          message={t("documents.confirmBatchPermanentDelete", {
            defaultValue: "Permanently delete {{count}} document(s)? This action cannot be undone.",
            count: selectedDocumentIds.length,
          })}
          confirmLabel={t("documents.permanentDelete", { defaultValue: "Permanent delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          confirmVariant="danger"
        />
    </PageLayout>
  );
};

export default DocumentsTrashPage;
