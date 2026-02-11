import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Alert, Icon, DataTable, ConfirmModal, Spinner, Button } from "../../../shared/components/ui";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import { useDocumentsTrashPageContainer } from "../containers/useDocumentsTrashPageContainer";
import type { Document } from "../../../app/adapter/api/documents.api";
import "../styles/documents.css";

type TrashDoc = Document & { deleted_at?: string; restore_deadline?: string };

const DocumentsTrashPage = () => {
  const { t } = useTranslation();
  const {
    routes,
    isAdmin,
    documents,
    loading,
    error,
    selectedDocumentIds,
    isSomeSelected,
    selectionConfig,
    restoreLoadingId,
    permanentDeleteId,
    isBatchRestoreConfirmOpen,
    isBatchPermanentDeleteConfirmOpen,
    isRestoring,
    isPermanentDeleting,
    handleRestore,
    handleOpenPermanentDelete,
    handleClosePermanentDelete,
    handleConfirmPermanentDelete,
    handleOpenBatchRestore,
    handleCloseBatchRestore,
    handleConfirmBatchRestore,
    handleOpenBatchPermanentDelete,
    handleCloseBatchPermanentDelete,
    handleConfirmBatchPermanentDelete,
  } = useDocumentsTrashPageContainer();

  const columns = useMemo(
    () => [
      {
        id: "name",
        header: t("documents.name", { defaultValue: "Document name" }),
        render: (row: TrashDoc) => row.name || row.title || "-",
      },
      {
        id: "barcode",
        header: t("documents.barcode", { defaultValue: "Barcode" }),
        render: (row: TrashDoc) => (
          <span className="Num">{row.barcode || "-"}</span>
        ),
      },
      {
        id: "type",
        header: t("documents.type", { defaultValue: "Type" }),
        render: (row: TrashDoc) =>
          row.document_type_name || row.document_type?.name || "-",
      },
      {
        id: "department",
        header: t("documents.department", { defaultValue: "Department" }),
        render: (row: TrashDoc) =>
          row.department_name || row.department?.name || "-",
      },
      {
        id: "deletedAt",
        header: t("documents.deletedAt", { defaultValue: "Deleted at" }),
        render: (row: TrashDoc) =>
          row.deleted_at
            ? formatRelativeTime(new Date(row.deleted_at))
            : "–",
      },
      {
        id: "restoreDeadline",
        header: t("documents.restoreDeadline", { defaultValue: "Restore deadline" }),
        render: (row: TrashDoc) =>
          row.restore_deadline
            ? formatRelativeTime(new Date(row.restore_deadline))
            : "–",
      },
    ],
    [t]
  );

  const rowActions = useMemo(
    () => [
      {
        id: "restore",
        label: t("documents.restore", { defaultValue: "Restore" }),
        variant: "outline" as const,
        className: "btn-outline-secondary me-1",
        disabled: (row: TrashDoc) => restoreLoadingId === row.id,
        renderLabel: (row: TrashDoc) =>
          restoreLoadingId === row.id ? (
            <>
              <Spinner size="sm" />
              {t("documents.restore", { defaultValue: "Restore" })}
            </>
          ) : (
            t("documents.restore", { defaultValue: "Restore" })
          ),
        onClick: (row: TrashDoc, e: React.MouseEvent) => {
          e.stopPropagation();
          handleRestore(row.id);
        },
      },
      {
        id: "permanentDelete",
        label: t("documents.permanentDelete", { defaultValue: "Permanent delete" }),
        icon: "trash",
        variant: "outline" as const,
        className: "btn-outline-danger",
        visible: () => isAdmin,
        onClick: (row: TrashDoc, e: React.MouseEvent) => {
          e.stopPropagation();
          handleOpenPermanentDelete(row.id);
        },
      },
    ],
    [t, isAdmin, restoreLoadingId, handleRestore, handleOpenPermanentDelete]
  );

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">{t("documents.trashView", { defaultValue: "Trash" })}</h2>
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
                  {t("documents.trashView", { defaultValue: "Trash" })}
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
            <Link to={routes.documents} className="btn btn-outline-secondary btn-sm">
              <Icon name="arrow-left" className="me-1" />
              {t("common.back", { defaultValue: "Back" })}
            </Link>
            <CollapseHeader />
          </div>
        </div>

        <div className="card documents__table-card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0">{t("documents.trashView", { defaultValue: "Trash" })}</h5>
              <span className="text-muted fs-13">
                {loading ? t("common.loading", { defaultValue: "Loading..." }) : (
                  <>
                    <span className="Num">{documents.length}</span>{" "}
                    {documents.length === 1
                      ? t("documents.document", { defaultValue: "document" })
                      : t("documents.documents", { defaultValue: "documents" })}
                  </>
                )}
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              {isSomeSelected && (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    className="btn-outline-secondary d-inline-flex align-items-center"
                    onClick={handleOpenBatchRestore}
                    disabled={isRestoring}
                    aria-label={t("documents.restoreSelected", { defaultValue: "Restore selected" })}
                  >
                    <Icon name="refresh-cw" className="me-1" />
                    {t("documents.restoreSelected", { defaultValue: "Restore selected" })}
                    {selectedDocumentIds.length > 0 && (
                      <span className="badge bg-secondary ms-2">{selectedDocumentIds.length}</span>
                    )}
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="md"
                      className="btn-outline-danger d-inline-flex align-items-center"
                      onClick={handleOpenBatchPermanentDelete}
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
              )}
            </div>
          </div>
          <div className="card-body h-100">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}
            <DataTable<TrashDoc>
              data={documents}
              getRowId={(row) => row.id}
              columns={columns}
              loading={loading}
              emptyMessage={t("common.noData", { defaultValue: "No data" })}
              rowActions={rowActions}
              selection={isAdmin ? selectionConfig : undefined}
              actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
            />
          </div>
        </div>

        <ConfirmModal
          isOpen={permanentDeleteId != null}
          onClose={handleClosePermanentDelete}
          onConfirm={handleConfirmPermanentDelete}
          title={t("documents.permanentDelete", { defaultValue: "Permanent delete" })}
          message={t("documents.confirmPermanentDelete", { defaultValue: "This will permanently delete the document. This action cannot be undone." })}
          confirmLabel={t("documents.permanentDelete", { defaultValue: "Permanent delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          confirmVariant="danger"
          isLoading={isPermanentDeleting}
        />

        <ConfirmModal
          isOpen={isBatchRestoreConfirmOpen}
          onClose={handleCloseBatchRestore}
          onConfirm={handleConfirmBatchRestore}
          title={t("documents.restoreSelected", { defaultValue: "Restore selected" })}
          message={t("documents.confirmBatchRestore", {
            defaultValue: "Restore {{count}} document(s)?",
            count: selectedDocumentIds.length,
          })}
          confirmLabel={t("documents.restore", { defaultValue: "Restore" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          confirmVariant="secondary"
          isLoading={isRestoring}
        />

        <ConfirmModal
          isOpen={isBatchPermanentDeleteConfirmOpen}
          onClose={handleCloseBatchPermanentDelete}
          onConfirm={handleConfirmBatchPermanentDelete}
          title={t("documents.permanentDeleteSelected", { defaultValue: "Permanent delete selected" })}
          message={t("documents.confirmBatchPermanentDelete", {
            defaultValue: "Permanently delete {{count}} document(s)? This action cannot be undone.",
            count: selectedDocumentIds.length,
          })}
          confirmLabel={t("documents.permanentDelete", { defaultValue: "Permanent delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          confirmVariant="danger"
          isLoading={isPermanentDeleting}
        />
      </div>
    </div>
  );
};

export default DocumentsTrashPage;
