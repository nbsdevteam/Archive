import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { Button, DataTable, Icon } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { usePermissionsPageContainer } from "../containers/usePermissionsPageContainer";
import type { AdminUser } from "../types/permissions.types";
import "../styles/permissions.css";

/**
 * PermissionsPage - Admin-only permissions management page with user search API.
 * Uses DataTable: table on desktop, cards on mobile (< 768px).
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

  const columns = useMemo(
    () => [
      {
        id: "name",
        header: t("app.name"),
        render: (row: AdminUser) => displayName(row),
      },
      {
        id: "email",
        header: t("app.email"),
        render: (row: AdminUser) => displayEmail(row),
      },
      {
        id: "role",
        header: t("app.role"),
        render: (row: AdminUser) => (
          <span
            className={`badge bg-${
              row.role === "admin" ? "danger" : row.role === "manager" ? "warning" : "info"
            }`}
          >
            {row.role}
          </span>
        ),
      },
      {
        id: "departments",
        header: t("app.departments"),
        render: (row: AdminUser) => displayDepartments(row),
      },
      {
        id: "actions",
        header: t("common.actions"),
        headerClassName: "text-end",
        className: "text-end",
        render: () => (
          <Button variant="secondary" size="sm">
            {t("common.edit")}
          </Button>
        ),
      },
    ],
    [t, displayName, displayEmail, displayDepartments]
  );

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
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap permissions__header">
          <h5 className="card-title mb-0">{t("app.userPermissions")}</h5>
          <div className="input-group permissions__search-wrap" style={{ maxWidth: "300px" }}>
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
          <DataTable<AdminUser>
            data={users}
            getRowId={(row) => row.id}
            columns={columns}
            loading={loading}
            emptyMessage={t("app.noUsersFound")}
            responsive="auto"
            cardsBelow="md"
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default PermissionsPage;
