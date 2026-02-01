import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { handleApiError } from "../../../app/adapter/api/client";
import { Spinner, Alert, Icon } from "../../../shared/components/ui";
import { useFolders } from "../../folders/hooks/useFolders";
import { useDocumentCount } from "../../documents/hooks/useDocumentCount";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import { groupFoldersByDepartment } from "../utils/groupFoldersByDepartment";
import "../styles/dashboard.css";

/**
 * LayoutModernDashboardPage - Default landing page (layout-modern).
 * Cards: Total Folders, Total Documents, Active Documents, Unread Notifications.
 * Notifications list from API + Folders by Department chart.
 */
const DOCUMENT_PARAMS = { status: "active" as const, per_page: 1, page: 1 };
const NOTIFICATION_PARAMS = { page: 1, per_page: 10 };

const LayoutModernDashboardPage = () => {
  const routes = all_routes;
  const [stats, setStats] = useState<{ total_documents?: number } | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const { folders, loading: foldersLoading, error: foldersError, pagination: foldersPagination } = useFolders({
    useApi: true,
  });
  const { count: activeDocumentsCount } = useDocumentCount({
    useApi: true,
    initialParams: {},
  });
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
  } = useNotifications({
    useApi: true,
    initialParams: NOTIFICATION_PARAMS,
  });

  const didRunRef = useRef(false);
  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const response = await adminApi.getDashboardStats();
        if (!cancelled && response?.stats) setStats(response.stats);
      } catch (err) {
        if (!cancelled) setStatsError(handleApiError(err));
      }
    })();
    return () => {
      cancelled = true;
      setTimeout(() => {
        didRunRef.current = false;
      }, 0);
    };
  }, []);

  const totalFolders = foldersPagination?.total ?? folders.length;
  const totalDocuments = stats?.total_documents ?? 0;
  const activeDocuments = activeDocumentsCount;

  const chartData = useMemo(() => groupFoldersByDepartment(folders), [folders]);
  const chartOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        height: 280,
        type: "bar",
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 5,
          horizontal: true,
          barHeight: "35%",
          endingShape: "rounded",
        },
      },
      dataLabels: { enabled: false },
      colors: ["#F26522"],
      grid: {
        borderColor: "#E5E7EB",
        strokeDashArray: 5,
        padding: { top: -20, left: 0, right: 0, bottom: 0 },
      },
      xaxis: {
        categories: chartData.categories,
        labels: { style: { colors: "#111827", fontSize: "13px" } },
      },
      series: [{ name: "Folders", data: chartData.data }],
    }),
    [chartData]
  );

  const loading = foldersLoading || docsLoading;
  const hasError = statsError || foldersError || notificationsError;

  return null;
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Dashboard</h2>
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
          <div className="card-body d-flex align-items-center justify-content-between flex-wrap pb-1">
            <div>
              <h3 className="mb-2">Welcome back</h3>
              <p className="mb-0">
                You have{" "}
                <Link to={routes.notifications} className="text-primary text-decoration-underline">
                  <span className="Num">{unreadCount}</span> unread notification{unreadCount !== 1 ? "s" : ""}
                </Link>
              </p>
            </div>
            <Link to={routes.notifications} className="btn btn-secondary btn-md">
              <Icon name="bell" className="me-1" />
              View notifications
            </Link>
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
                  <div className="card-body">
                    <span className="avatar rounded-circle bg-primary mb-2">
                      <Icon name="folder" className="fs-16" />
                    </span>
                    <h6 className="fs-13 fw-medium text-default mb-1">Total Folders</h6>
                    <h4 className="mb-0 Num">{totalFolders.toLocaleString()}</h4>
                    <Link to={routes.folders} className="link-default mt-2 d-inline-block">
                      View folders
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <div className="card-body">
                    <span className="avatar rounded-circle bg-secondary mb-2">
                      <Icon name="file-text" className="fs-16" />
                    </span>
                    <h6 className="fs-13 fw-medium text-default mb-1">Total Documents</h6>
                    <h4 className="mb-0 Num">{totalDocuments.toLocaleString()}</h4>
                    <Link to={routes.documents} className="link-default mt-2 d-inline-block">
                      View documents
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <div className="card-body">
                    <span className="avatar rounded-circle bg-info mb-2">
                      <Icon name="file-check" className="fs-16" />
                    </span>
                    <h6 className="fs-13 fw-medium text-default mb-1">Active Documents</h6>
                    <h4 className="mb-0 Num">{activeDocuments.toLocaleString()}</h4>
                    <Link to={routes.documents} className="link-default mt-2 d-inline-block">
                      View documents
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 d-flex">
                <div className="card flex-fill">
                  <div className="card-body">
                    <span className="avatar rounded-circle bg-warning mb-2">
                      <Icon name="bell" className="fs-16" />
                    </span>
                    <h6 className="fs-13 fw-medium text-default mb-1">Unread Notifications</h6>
                    <h4 className="mb-0 Num">{unreadCount.toLocaleString()}</h4>
                    <Link to={routes.notifications} className="link-default mt-2 d-inline-block">
                      View notifications
                    </Link>
                  </div>
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
