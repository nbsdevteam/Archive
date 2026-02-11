import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactApexChart from "react-apexcharts";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Spinner, Alert, Icon } from "../../../shared/components/ui";
import { useLayoutModernDashboardPageContainer } from "../containers/useLayoutModernDashboardPageContainer";
import "../styles/dashboard.css";

/**
 * LayoutModernDashboardPage - Default landing page (layout-modern).
 * Cards: Total Folders, Active Documents, Archived Documents, Unread Notifications.
 * Notifications list from API + Folders by Department chart.
 */
const LayoutModernDashboardPage = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const {
    statsError,
    foldersError,
    notifications,
    unreadCount,
    notificationsLoading,
    notificationsError,
    totalFolders,
    activeDocuments,
    archivedDocuments,
    trashedDocuments,
    chartData,
    chartOptions,
    loading,
    hasError,
  } = useLayoutModernDashboardPageContainer();

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">Dashboard</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.Modern}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Dashboard
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="ms-2 head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>

        {hasError && (
          <Alert variant="danger" className="mb-3">
            {statsError || foldersError || notificationsError}
          </Alert>
        )}

        {/* Welcome */}
        <div className="card border-0 mb-3">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0">Welcome back Admin</h5>
              <span className="text-muted fs-13">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </span>
            </div>
            <Link to={routes.notifications} className="btn btn-secondary btn-md">
              <Icon name="bell" className="me-1" />
              View notifications
            </Link>
          </div>
          <div className="card-body pt-3 pb-2">
            <p className="mb-0">
              You have{" "}
              <Link to={routes.notifications} className="text-primary text-decoration-underline">
                <span className="Num">{unreadCount}</span> unread notification{unreadCount !== 1 ? "s" : ""}
              </Link>
              . Keep an eye on new uploads and approvals.
            </p>
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner size="md" />
          </div>
        ) : (
          <>
            <div className="row mb-3">
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <Link to={routes.folders} className="dashboard-stat-card-link card-body d-flex flex-column text-decoration-none text-body">
                    <span className="avatar rounded-circle bg-primary mb-2">
                      <Icon name="folder" className="fs-16" />
                    </span>
                    <h6 className="fs-13 fw-medium text-default mb-1">Total Folders</h6>
                    <h4 className="mb-0 Num" onClick={(e) => e.stopPropagation()}>{totalFolders.toLocaleString()}</h4>
                    <span className="link-default mt-2 d-inline-block">View folders</span>
                  </Link>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <Link to={routes.documents} className="dashboard-stat-card-link card-body d-flex flex-column text-decoration-none text-body">
                    <span className="avatar rounded-circle bg-info mb-2">
                      <Icon name="file-check" className="fs-16" />
                    </span>
                    <h6 className="fs-13 fw-medium text-default mb-1">{t("dashboard.activeDocuments")}</h6>
                    <h4 className="mb-0 Num" onClick={(e) => e.stopPropagation()}>{activeDocuments.toLocaleString()}</h4>
                    <span className="link-default mt-2 d-inline-block">View documents</span>
                  </Link>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <Link to={routes.archiveDocuments} className="dashboard-stat-card-link card-body d-flex flex-column text-decoration-none text-body">
                    <span className="avatar rounded-circle bg-secondary mb-2">
                      <Icon name="archive" className="fs-16" />
                    </span>
                    <h6 className="fs-13 fw-medium text-default mb-1">{t("dashboard.archivedDocuments")}</h6>
                    <h4 className="mb-0 Num" onClick={(e) => e.stopPropagation()}>{archivedDocuments.toLocaleString()}</h4>
                    <span className="link-default mt-2 d-inline-block">View documents</span>
                  </Link>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <Link to={routes.documentsTrash} className="dashboard-stat-card-link card-body d-flex flex-column text-decoration-none text-body">
                    <span className="avatar rounded-circle bg-danger-subtle text-danger mb-2">
                      <Icon name="trash-2" className="fs-16" />
                    </span>
                    <h6 className="fs-13 fw-medium text-default mb-1">{t("dashboard.trashedDocuments")}</h6>
                    <h4 className="mb-0 Num" onClick={(e) => e.stopPropagation()}>{trashedDocuments.toLocaleString()}</h4>
                    <span className="link-default mt-2 d-inline-block">View details</span>
                  </Link>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <Link to={routes.notifications} className="dashboard-stat-card-link card-body d-flex flex-column text-decoration-none text-body">
                    <span className="avatar rounded-circle bg-warning mb-2">
                      <Icon name="bell" className="fs-16" />
                    </span>
                    <h6 className="fs-13 fw-medium text-default mb-1">Unread Notifications</h6>
                    <h4 className="mb-0 Num" onClick={(e) => e.stopPropagation()}>{unreadCount.toLocaleString()}</h4>
                    <span className="link-default mt-2 d-inline-block">View notifications</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="row">
              {/* Notifications list */}
              <div className="col-lg-5 col-xl-4">
                <div className="card">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="card-title mb-0">Notifications</h5>
                    <Link to={routes.notifications} className="btn btn-sm btn-secondary">
                      All
                    </Link>
                  </div>
                  <div className="card-body p-0">
                    {notificationsLoading ? (
                      <div className="p-3 text-center">
                        <Spinner size="sm" />
                      </div>
                    ) : notificationsError ? (
                      <div className="p-3 text-danger small">{notificationsError}</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-3 text-muted small">No notifications</div>
                    ) : (
                      <ul className="list-group list-group-flush">
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            className={`list-group-item list-group-item-action ${!n.is_read ? "bg-light" : ""}`}
                          >
                            <div className="d-flex w-100 justify-content-between">
                              <h6 className="mb-1">{n.title}</h6>
                              {!n.is_read && (
                                <span className="badge bg-primary rounded-pill">New</span>
                              )}
                            </div>
                            <p className="mb-1 small text-muted">{n.message}</p>
                            <small className="text-muted">
                              {n.created_at
                                ? new Date(n.created_at).toLocaleString()
                                : ""}
                            </small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Folders by Department chart */}
              <div className="col-lg-7 col-xl-8">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">Folders by Department</h5>
                  </div>
                  <div className="card-body">
                    {foldersLoading ? (
                      <div className="text-center py-4">
                        <Spinner size="md" />
                      </div>
                    ) : chartData.categories.length === 0 ? (
                      <div className="text-center py-4 text-muted">No folder data</div>
                    ) : (
                      <ReactApexChart
                        options={chartOptions}
                        series={chartOptions.series}
                        type="bar"
                        height={280}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LayoutModernDashboardPage;
