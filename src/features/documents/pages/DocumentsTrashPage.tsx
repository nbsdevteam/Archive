import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Button, Spinner, Alert, Icon, ConfirmModal } from "../../../shared/components/ui";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import { useDocumentsTrashPageContainer } from "../containers/useDocumentsTrashPageContainer";
import "../styles/documents.css";

const DocumentsTrashPage = () => {
  const { t } = useTranslation();
  const {
    routes,
    isAdmin,
    documents,
    loading,
    error,
    restoreLoadingId,
    permanentDeleteId,
    isPermanentDeleting,
    handleRestore,
    handleOpenPermanentDelete,
    handleClosePermanentDelete,
    handleConfirmPermanentDelete,
  } = useDocumentsTrashPageContainer();

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
          </div>
          <div className="card-body">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}
            {loading ? (
              <div className="text-center py-4">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped mb-0">
                  <thead>
                    <tr>
                      <th>{t("documents.name", { defaultValue: "Document name" })}</th>
                      <th>{t("documents.barcode", { defaultValue: "Barcode" })}</th>
                      <th>{t("documents.type", { defaultValue: "Type" })}</th>
                      <th>{t("documents.department", { defaultValue: "Department" })}</th>
                      <th>{t("documents.deletedAt", { defaultValue: "Deleted at" })}</th>
                      <th>{t("documents.restoreDeadline", { defaultValue: "Restore deadline" })}</th>
                      <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          {t("common.noData", { defaultValue: "No data" })}
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => (
                        <tr key={doc.id}>
                          <td>{doc.name || doc.title || "-"}</td>
                          <td className="Num">{doc.barcode || "-"}</td>
                          <td>{doc.document_type_name || doc.document_type?.name || "-"}</td>
                          <td>{doc.department_name || doc.department?.name || "-"}</td>
                          <td>{doc.deleted_at ? formatRelativeTime(new Date(doc.deleted_at)) : "–"}</td>
                          <td>{doc.restore_deadline ? formatRelativeTime(new Date(doc.restore_deadline)) : "–"}</td>
                          <td className="text-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-outline-secondary me-1"
                              onClick={() => handleRestore(doc.id)}
                              disabled={restoreLoadingId === doc.id}
                            >
                              {restoreLoadingId === doc.id ? <Spinner size="sm" /> : t("documents.restore", { defaultValue: "Restore" })}
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-danger"
                                onClick={() => handleOpenPermanentDelete(doc.id)}
                              >
                                <Icon name="trash" className="me-1" />
                                {t("documents.permanentDelete", { defaultValue: "Permanent delete" })}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
      </div>
    </div>
  );
};

export default DocumentsTrashPage;
