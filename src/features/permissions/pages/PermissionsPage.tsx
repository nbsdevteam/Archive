import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { Button, DataTable, Icon } from "@/shared/components/ui";
import { PageLayout } from "@/shared/layout/PageLayout";
import { usePermissionsPageContainer } from "../containers/usePermissionsPageContainer";
import type { AdminUser } from "../types/permissions.types";
import {
  AdminResetPasswordModal,
  CreateUserModal,
  DeactivateUserModal,
  UserDetailModal,
} from "../components/AdminUserModals";
import "../styles/permissions.css";

/**
 * Admin permissions page: user CRUD and capability editor.
 */
const PermissionsPage = () => {
  const { t } = useTranslation();
  const c = usePermissionsPageContainer();

  const columns = useMemo(
    () => [
      {
        id: "name",
        header: t("app.name"),
        render: (row: AdminUser) => c.displayName(row),
      },
      {
        id: "email",
        header: t("app.email"),
        render: (row: AdminUser) => c.displayEmail(row),
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
        render: (row: AdminUser) => c.displayDepartments(row),
      },
      {
        id: "actions",
        header: t("common.actions"),
        headerClassName: "text-end",
        className: "text-end",
        render: (row: AdminUser) => (
          <div className="d-flex gap-1 justify-content-end flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => c.openUserDetails(row)}>
              {t("common.edit")}
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={() => c.setResetUser(row)}
              aria-label={t("app.resetUserPassword", { defaultValue: "Reset password" })}
            >
              <Icon name="edit" />
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => c.setDeactivateUser(row)}
            >
              {t("app.deactivate", { defaultValue: "Deactivate" })}
            </Button>
          </div>
        ),
      },
    ],
    [t, c],
  );

  if (!c.isAdmin) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="card">
            <div className="card-body text-center">
              <h5>{t("app.accessDenied")}</h5>
              <p className="text-muted">{t("app.noPermissionPage")}</p>
              <Link to={c.routes.adminDashboard} className="btn btn-secondary btn-md">
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
      homeTo={c.routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 permissions__header">
          <h5 className="card-title mb-0">{t("app.userPermissions")}</h5>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <select
              className="form-select form-select-sm"
              style={{ width: 140 }}
              value={c.roleFilter}
              onChange={(e) => c.setRoleFilter(e.target.value as typeof c.roleFilter)}
              aria-label={t("app.filterByRole", { defaultValue: "Filter by role" })}
            >
              <option value="">{t("app.allRoles", { defaultValue: "All roles" })}</option>
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="employee">employee</option>
            </select>
            <div className="input-group permissions__search-wrap" style={{ maxWidth: "280px" }}>
              <input
                type="text"
                className="form-control control-height-md"
                placeholder={t("app.searchUsers")}
                value={c.searchTerm}
                onChange={(e) => c.setSearchTerm(e.target.value)}
                aria-label={t("app.searchUsersAria")}
              />
              <Button variant="secondary" size="md" type="button" aria-label={t("app.searchAria")}>
                <Icon name="search" />
              </Button>
            </div>
            <Button variant="secondary" onClick={() => c.setCreateOpen(true)}>
              {t("app.createUser", { defaultValue: "Create user" })}
            </Button>
          </div>
        </div>
        <div className="card-body">
          {c.error && (
            <div className="alert alert-danger mb-3" role="alert">
              {c.error}
            </div>
          )}
          <DataTable<AdminUser>
            data={c.users}
            getRowId={(row) => row.id}
            columns={columns}
            loading={c.loading}
            emptyMessage={t("app.noUsersFound")}
            responsive="auto"
            cardsBelow="md"
          />
        </div>
      </div>

      <CreateUserModal
        open={c.createOpen}
        onClose={() => c.setCreateOpen(false)}
        onSubmit={c.handleCreateUser}
        saving={c.saving}
      />
      <UserDetailModal
        open={c.detailOpen}
        user={c.detailUser}
        onClose={() => {
          c.setDetailOpen(false);
        }}
        onSaveEdit={c.handleSaveEdit}
        onSavePermissions={c.handleSavePermissions}
        saving={c.saving}
      />
      <DeactivateUserModal
        open={Boolean(c.deactivateUser)}
        user={c.deactivateUser}
        onClose={() => c.setDeactivateUser(null)}
        onConfirm={c.handleDeactivate}
        saving={c.saving}
      />
      <AdminResetPasswordModal
        open={Boolean(c.resetUser)}
        user={c.resetUser}
        onClose={() => c.setResetUser(null)}
        onSubmit={c.handleAdminResetPassword}
        saving={c.saving}
      />
    </PageLayout>
  );
};

export default PermissionsPage;
