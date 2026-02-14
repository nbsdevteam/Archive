import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../../core/common/collapse-header/collapse-header";
import { PageLayout } from "../../../../shared/layout/PageLayout";
import { useConfirmDialog, useConfirmDialogEmpty } from "../../../../shared/hooks";
import type { Document } from "../../../../app/adapter/api/documents.api";
import { buildRowActions } from "../../../../shared/utils/buildRowActions";
import { useDocumentsPageContainer } from "../../containers/useDocumentsPageContainer";
import { getDocumentTableColumns } from "../../utils/documentTableColumns";
import { DocumentsToolbar } from "./DocumentsToolbar";
import { DocumentsTableCard } from "./DocumentsTableCard";
import type { DocumentsModalsProps } from "./DocumentsModals";
import { DocumentsModals } from "./DocumentsModals";
import "../../styles/documents.css";

/**
 * Documents list page: orchestrates container, table columns/row actions, and composes
 * DocumentsToolbar, DocumentsTableCard, and DocumentsModals. Kept under 250 lines.
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
        <DocumentsToolbar
          t={t}
          loading={loading}
          documents={documents}
          isSomeSelected={isSomeSelected}
          selectedDocumentIds={selectedDocumentIds}
          filter={filter}
          actions={{
            handleOpenBatchMoveConfirm: actions.handleOpenBatchMoveConfirm,
            handleOpenUpload: actions.handleOpenUpload,
            handleRefresh: actions.handleRefresh,
          }}
          modals={modals}
          batchArchiveDialog={batchArchiveDialog}
          batchTrashDialog={batchTrashDialog}
          routes={routes}
        />
        <DocumentsTableCard
          t={t}
          documents={documents}
          loading={loading}
          error={error}
          columns={columns}
          rowActions={rowActions}
          selectionConfig={selectionConfig}
          onRetry={actions.handleRetry}
          onRowClick={actions.handleNavigateToDocument}
        />
      </div>
      <DocumentsModals
        t={t}
        modals={modals}
        actions={
          {
            handleCloseUpload: actions.handleCloseUpload,
            handleUploadSuccess: actions.handleUploadSuccess,
            handleCloseBatchMoveConfirm: actions.handleCloseBatchMoveConfirm,
            handleConfirmBatchMove: actions.handleConfirmBatchMove,
          } satisfies DocumentsModalsProps["actions"]
        }
        trashDialog={trashDialog}
        archiveDialog={archiveDialog}
        batchArchiveDialog={batchArchiveDialog}
        batchTrashDialog={batchTrashDialog}
        selectedDocumentIds={selectedDocumentIds}
      />
    </PageLayout>
  );
};

export default DocumentsPage;
