import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Button, Spinner, Icon } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { usePermissionsPageContainer } from "../containers/usePermissionsPageContainer";

/**
 * PermissionsPage - Admin-only permissions management page with user search API
 */
const PermissionsPage = () => {
  const { t } = useTranslation();
  const {
    routes,
    isAdmin,
    searchTerm,
    users,
    loading,
    error,
    setSearchTerm,
    displayName,
    displayEmail,
    displayDepartments,
  } = usePermissionsPageContainer();

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);

  if (!isAdmin) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="card">
            <div className="card-body text-center">
              <h5>{t("app.accessDenied")}</h5>
              <p className="text-muted">{t("app.noPermissionPage")}</p>
              <Link to={routes.adminDashboard} className="btn btn-secondary btn-md">
                {t("app.goToDashboard")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title={t("app.permissions")}
      breadcrumbItems={[{ label: t("app.administrator") }]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">{t("app.userPermissions")}</h5>
            <div className="input-group" style={{ maxWidth: "300px" }}>
              <input
                type="text"
                className="form-control control-height-md"
                placeholder={t("app.searchUsers")}
                value={searchTerm}
                onChange={handleSearchTermChange}
                aria-label={t("app.searchUsersAria")}
              />
              <Button variant="secondary" size="md" type="button" aria-label={t("app.searchAria")}>
                <Icon name="search" />
              </Button>
            </div>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger mb-3" role="alert">
                {error}
              </div>
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
                      <th>{t("app.name")}</th>
                      <th>{t("app.email")}</th>
                      <th>{t("app.role")}</th>
                      <th>{t("app.departments")}</th>
                      <th className="text-end">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && !loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted">
                          {t("app.noUsersFound")}
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td>{displayName(u)}</td>
                          <td>{displayEmail(u)}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                u.role === "admin" ? "danger" : u.role === "manager" ? "warning" : "info"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td>{displayDepartments(u)}</td>
                          <td className="text-end">
                            <Button variant="secondary" size="sm">{t("common.edit")}</Button>
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
    </PageLayout>
  );
};

export default PermissionsPage;
