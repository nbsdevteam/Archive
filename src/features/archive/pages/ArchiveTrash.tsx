import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { useArchiveTrash } from "../hooks";
import { PageLayout } from "../../../shared/layout/PageLayout";

const ArchiveTrash = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const { trashedItems, loading, error, restoreItem, deletePermanently, emptyTrash } = useArchiveTrash({ useApi: false });

  const handleEmptyTrash = () => emptyTrash();
  const getRestoreItemClickHandler = (id: string | number | undefined) => () => id && restoreItem(id);
  const getDeletePermanentlyClickHandler = (id: string | number | undefined) => () => id && deletePermanently(id);

  return (
    <PageLayout
      title={t("archive.trashTitle", { defaultValue: "Trash" })}
      breadcrumbItems={[{ label: t("archive.breadcrumb", { defaultValue: "Archive" }) }]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">{t("archive.recentlyDeleted", { defaultValue: "Recently Deleted" })}</h5>
            <button
              className="btn btn-light btn-sm"
              onClick={handleEmptyTrash}
            >
              {t("archive.emptyTrash", { defaultValue: "Empty Trash" })}
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>{t("documents.name", { defaultValue: "Name" })}</th>
                    <th>{t("documents.type", { defaultValue: "Type" })}</th>
                    <th>{t("archive.deleted", { defaultValue: "Deleted" })}</th>
                    <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center">
                        {t("common.loading", { defaultValue: "Loading..." })}
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="text-center text-danger">
                        {error}
                      </td>
                    </tr>
                  ) : trashedItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        {t("archive.noTrashedItems", { defaultValue: "No trashed items" })}
                      </td>
                    </tr>
                  ) : (
                    trashedItems.map((item, idx) => (
                      <tr key={item.id ?? item.name ?? idx}>
                        <td>{item.name ?? ""}</td>
                        <td>{item.type ?? ""}</td>
                        <td>{item.updated ?? ""}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-light me-1"
                            onClick={getRestoreItemClickHandler(item.id)}
                          >
                            {t("archive.restore", { defaultValue: "Restore" })}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={getDeletePermanentlyClickHandler(item.id)}
                          >
                            {t("common.delete", { defaultValue: "Delete" })}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </PageLayout>
  );
};

export default ArchiveTrash;
