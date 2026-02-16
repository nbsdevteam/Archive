import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Button, Spinner, Icon } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { usePermissionsPageContainer } from "../containers/usePermissionsPageContainer";

/**
 * PermissionsPage - Admin-only permissions management page with user search API
 */
const PermissionsPage = () => {
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
              <h5>Access Denied</h5>
              <p className="text-muted">You do not have permission to access this page.</p>
              <Link to={routes.adminDashboard} className="btn btn-secondary btn-md">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Permissions"
      breadcrumbItems={[{ label: "Admin" }]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">User Permissions</h5>
            <div className="input-group" style={{ maxWidth: "300px" }}>
              <input
                type="text"
                className="form-control control-height-md"
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearchTermChange}
                aria-label="Search users"
              />
              <Button variant="secondary" size="md" type="button" aria-label="Search">
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
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Departments</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && !loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted">
                          No users found
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
                            <Button variant="secondary" size="sm">Edit</Button>
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
