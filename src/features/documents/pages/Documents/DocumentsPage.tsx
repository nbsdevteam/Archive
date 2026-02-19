import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import CollapseHeader from "@/core/common/collapse-header/collapse-header";
import { PageLayout } from "@/shared/layout/PageLayout";
import { useConfirmDialog, useConfirmDialogEmpty } from "@/shared/hooks";
import type { Document } from "@/app/adapter/api/documents.api";
import { buildRowActions } from "@/shared/utils/buildRowActions";
import { EditDocumentSidePanel } from "@/features/documents/components/EditDocument";
import { useDocumentsPageContainer } from "@/features/documents/containers/useDocumentsPageContainer";
import { useDocumentsTableSort } from "@/features/documents/hooks/useDocumentsTableSort";
import { getDocumentTableColumns } from "@/features/documents/utils/documentTableColumns";
import { DocumentsToolbar } from "./DocumentsToolbar";
import { DocumentsTableCard } from "./DocumentsTableCard";
import type { DocumentsModalsProps } from "./DocumentsModals";
import { DocumentsModals } from "./DocumentsModals";
import { PaginationSection } from "@/shared/components/PaginationSection";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsContext";
import { SHORTCUT_KEYS } from "@/shared/shortcuts/shortcutsRegistry";
import "@/features/documents/styles/documents.css";

/**
 * Documents list page: orchestrates container, table columns/row actions, and composes
 * DocumentsToolbar, DocumentsTableCard, and DocumentsModals. Kept under 250 lines.
 */
const DocumentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { registerHandler } = useShortcuts();
  const { data, loading, error, filter, selection, paging, actions, modals } = useDocumentsPageContainer();
  const { documents, routes, pagination } = data;
  const { selectedDocumentIds, selectionConfig, isSomeSelected, batchActions } = selection;
  const { handlePageChange, handlePerPageChange } = paging;
  const { sortedDocuments, onSortClick, getSortIconForColumn } = useDocumentsTableSort(documents);

  useEffect(() => {
    registerHandler(SHORTCUT_KEYS.NEW_DOCUMENT, () => actions.handleOpenUpload());
    return () => registerHandler(SHORTCUT_KEYS.NEW_DOCUMENT, undefined);
  }, [registerHandler, actions.handleOpenUpload]);

  useEffect(() => {
    registerHandler(SHORTCUT_KEYS.VIEW_TRASH, () => navigate(routes.documentsTrash));
    return () => registerHandler(SHORTCUT_KEYS.VIEW_TRASH, undefined);
  }, [navigate, routes.documentsTrash, registerHandler]);

  useEffect(() => {
    registerHandler(SHORTCUT_KEYS.REFRESH_PAGE, () => actions.handleRefresh());
    return () => registerHandler(SHORTCUT_KEYS.REFRESH_PAGE, undefined);
  }, [registerHandler, actions.handleRefresh]);

  const trashDialog = useConfirmDialog<number>({ onConfirm: actions.confirmTrash });
  const restoreDialog = useConfirmDialog<number>({ onConfirm: actions.confirmRestore });
  const archiveDialog = useConfirmDialog<number>({ onConfirm: actions.confirmArchive });
  const unarchiveDialog = useConfirmDialog<number>({ onConfirm: actions.confirmUnarchive });
  const batchTrashDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchTrash });
  const batchArchiveDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchArchive });
  const batchUnarchiveDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchUnarchive });
  const batchRestoreDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchRestore });

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
          id: "edit",
          labelKey: "common.edit",
          defaultValue: "Edit",
          icon: "pencil",
          variant: "outline",
          className: "btn-outline-secondary me-1",
          visible: (row) => row.is_main_document === true || row.is_main_document === false,
          onClick: (row) => actions.handleOpenEdit(row.id),
        },
        {
          id: "transfer",
          labelKey: "documents.transfer",
          defaultValue: "Transfer to folder",
          icon: "arrow-right-left",
          variant: "outline",
          className: "btn-outline-secondary me-1",
          /** Only secondary (sub) documents can be transferred; main document cannot be transferred. */
          visible: (row) => row.is_main_document === false,
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
          id: "unarchive",
          labelKey: "documents.unarchive",
          defaultValue: "Unarchive",
          icon: "archive",
          variant: "outline",
          className: "btn-outline-secondary me-1",
          visible: (row) => (row.status ?? "").toLowerCase() === "archived",
          onClick: (row) => unarchiveDialog.open(row.id),
        },
        {
          id: "trash",
          labelKey: "documents.moveToTrash",
          defaultValue: "Move to trash",
          icon: "trash-2",
          variant: "outline",
          className: "btn-outline-danger",
          /** Hide move-to-trash for main documents on /documents (main docs are managed via folder). Show only when not in trash. */
          visible: (row) => {
            if (row.is_main_document === true) return false;
            const s = (row.status ?? "").toLowerCase();
            return !s.includes("trash") && !s.includes("deleted");
          },
          onClick: (row) => trashDialog.open(row.id),
        },
        {
          id: "restore",
          labelKey: "documents.restore",
          defaultValue: "Restore",
          icon: "refresh-cw",
          variant: "outline",
          className: "btn-outline-success",
          /** Show only for documents with trash/deleted status. */
          visible: (row) => {
            const s = (row.status ?? "").toLowerCase();
            return s.includes("trash") || s.includes("deleted");
          },
          onClick: (row) => restoreDialog.open(row.id),
        },
      ]),
    [
      t,
      actions.handleDownloadDocument,
      actions.handleNavigateToDocument,
      actions.handleOpenEdit,
      actions.handleOpenSingleMoveConfirm,
      archiveDialog.open,
      unarchiveDialog.open,
      trashDialog.open,
      restoreDialog.open,
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
          batchActions={batchActions}
          filter={filter}
          actions={{
            handleOpenBatchMoveConfirm: actions.handleOpenBatchMoveConfirm,
            handleOpenUpload: actions.handleOpenUpload,
            handleRefresh: actions.handleRefresh,
          }}
          modals={modals}
          batchArchiveDialog={batchArchiveDialog}
          batchRestoreDialog={batchRestoreDialog}
          batchUnarchiveDialog={batchUnarchiveDialog}
          onMoveSelectedToTrashClick={() => actions.handleBatchTrashClick(() => batchTrashDialog.open())}
          routes={routes}
        />
        <DocumentsTableCard
          t={t}
          documents={sortedDocuments}
          loading={loading}
          error={error}
          columns={columns}
          rowActions={rowActions}
          selectionConfig={selectionConfig}
          onRetry={actions.handleRetry}
          onRowClick={actions.handleNavigateToDocument}
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
      <DocumentsModals
        t={t}
        modals={modals}
        actions={
          {
            handleCloseUpload: actions.handleCloseUpload,
            handleUploadSuccess: actions.handleUploadSuccess,
            handleCloseBatchMoveConfirm: actions.handleCloseBatchMoveConfirm,
            handleConfirmBatchMove: actions.handleConfirmBatchMove,
            handleCloseMainFilesBlockModal: actions.handleCloseMainFilesBlockModal,
          } satisfies DocumentsModalsProps["actions"]
        }
        trashDialog={trashDialog}
        restoreDialog={restoreDialog}
        archiveDialog={archiveDialog}
        unarchiveDialog={unarchiveDialog}
        batchArchiveDialog={batchArchiveDialog}
        batchUnarchiveDialog={batchUnarchiveDialog}
        batchTrashDialog={batchTrashDialog}
        batchRestoreDialog={batchRestoreDialog}
        selectedDocumentIds={selectedDocumentIds}
      />
      <EditDocumentSidePanel
        isOpen={modals.editDocumentId != null}
        documentId={modals.editDocumentId}
        onClose={actions.handleCloseEdit}
        onSuccess={actions.handleEditSuccess}
      />
    </PageLayout>
  );
};

export default DocumentsPage;
