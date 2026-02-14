import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Alert, Icon, DataTable, ConfirmModal, Spinner, Button } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useConfirmDialog, useConfirmDialogEmpty } from "../../../shared/hooks";
import { buildRowActions } from "../../../shared/utils/buildRowActions";
import { useDocumentsTrashPageContainer } from "../containers/useDocumentsTrashPageContainer";
import {
  getDocumentTableColumnsForTrash,
  type TrashDocument,
} from "../utils/documentTableColumns";
import "../styles/documents.css";

const DocumentsTrashPage = () => {
  const { t } = useTranslation();
  const { data, loading, error, selection, actions, modals } = useDocumentsTrashPageContainer();
  const { routes, documents, isAdmin } = data;
  const { selectedDocumentIds, isSomeSelected, selectionConfig } = selection;
  const { restoreLoadingId, isRestoring, isPermanentDeleting } = modals;

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
                    onClick={batchRestoreDialog.open}
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
              )}
            </div>
          </div>
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
