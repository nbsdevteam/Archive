import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { handleApiError } from "../../../app/adapter/api/client";
import { Spinner, Alert, Icon } from "../../../shared/components/ui";
import { useFolders } from "../../folders/hooks/useFolders";
import { useDocuments } from "../../documents/hooks/useDocuments";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import { CreateFolderSidePanel } from "../../folders/components";
import { UploadDocumentSidePanel } from "../../documents/components";
import { groupFoldersByDepartment } from "../utils/groupFoldersByDepartment";
import "../styles/dashboard.css";

const DOCUMENT_PARAMS_ACTIVE = { status: "active" as const, per_page: 1, page: 1 };
const DOCUMENT_PARAMS_ARCHIVED = { status: "archived" as const, per_page: 1, page: 1 };
const NOTIFICATION_PARAMS = { page: 1, per_page: 10 };

/**
 * DashboardPage - Unified dashboard (canonical /dashboard).
 * Welcome back Admin, compact cards + Folders by Department chart on same row, notifications list.
 */
const DashboardPage = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const [stats, setStats] = useState<{ total_documents?: number } | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [folderPanelOpen, setFolderPanelOpen] = useState(false);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);

  const { folders, loading: foldersLoading, error: foldersError, pagination: foldersPagination, fetchFolders } = useFolders({
    useApi: true,
  });
  const { pagination: docsActivePagination } = useDocuments({
    useApi: true,
    initialParams: DOCUMENT_PARAMS_ACTIVE,
  });
  const { pagination: docsArchivedPagination } = useDocuments({
    useApi: true,
    initialParams: DOCUMENT_PARAMS_ARCHIVED,
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

  useEffect(() => {
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
    };
  }, []);

  const totalFolders = foldersPagination?.total ?? folders.length;
  const totalDocuments = stats?.total_documents ?? 0;
  const activeDocuments = docsActivePagination?.total ?? 0;
  const archivedDocuments = docsArchivedPagination?.total ?? 0;

  const chartData = useMemo(() => groupFoldersByDepartment(folders), [folders]);
  const chartOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        height: 235,
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
        padding: { top: -20, left: 0, right: 0, bottom: -20 },
      },
      xaxis: {
        categories: chartData.categories,
        labels: { style: { colors: "#111827", fontSize: "12px" } },
      },
      series: [{ name: "Folders", data: chartData.data }],
    }),
    [chartData]
  );

  const loading = foldersLoading;
  const hasError = statsError || foldersError || notificationsError;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">{t("dashboard.title")}</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.dashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {t("dashboard.title")}
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

        {/* Welcome + quick actions */}
        <div className="card border-0 mb-3">
          <div className="card-body d-flex align-items-center justify-content-between flex-wrap pb-1">
            <div>
              <h3 className="mb-2">Welcome back Admin</h3>
              <p className="mb-0">
                You have{" "}
                <Link to={routes.notifications} className="text-primary text-decoration-underline">
                  {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </Link>
              </p>
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <button type="button" className="btn btn-secondary btn-md" onClick={() => setFolderPanelOpen(true)}>
                <Icon name="folder-plus" className="me-1" />
                Add Folder
              </button>
              <button type="button" className="btn btn-secondary btn-md" onClick={() => setUploadPanelOpen(true)}>
                <Icon name="upload" className="me-1" />
                Upload Document
              </button>
              <Link to={routes.notifications} className="btn btn-secondary btn-md">
                <Icon name="bell" className="me-1" />
                View notifications
              </Link>
            </div>
          </div>
        </div>

        <CreateFolderSidePanel
          isOpen={folderPanelOpen}
          onClose={() => setFolderPanelOpen(false)}
          onSuccess={() => fetchFolders()}
        />
        <UploadDocumentSidePanel
          isOpen={uploadPanelOpen}
          onClose={() => setUploadPanelOpen(false)}
        />

        {/* Cards + Chart on same row (compact cards) */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner size="md" />
          </div>
        ) : (
          <>
            {/* Single row: all 5 cards on the left (row + wrap), Folders by Department chart on the right */}
            <div className="row mb-3 align-items-stretch">
              <div className="col-xxl-4">
                <div className="row flex-wrap g-3">
                  <div className="col-6 col-md-4 d-flex">
                    <div className="card flex-fill w-100">
                      <div className="card-body">
                        <span className="avatar rounded-circle bg-primary mb-2">
                          <Icon name="folder" className="fs-16" />
                        </span>
                        <h6 className="fs-13 fw-medium text-default mb-1">{t("dashboard.totalFolders")}</h6>
                        <h3 className="mb-3">{totalFolders.toLocaleString()}</h3>
                        <Link to={routes.folders} className="link-default">{t("dashboard.viewDetails")}</Link>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4 d-flex">
                    <div className="card flex-fill w-100">
                      <div className="card-body">
                        <span className="avatar rounded-circle bg-secondary mb-2">
                          <Icon name="file-text" className="fs-16" />
                        </span>
                        <h6 className="fs-13 fw-medium text-default mb-1">{t("dashboard.totalDocuments")}</h6>
                        <h3 className="mb-3">{totalDocuments.toLocaleString()}</h3>
                        <Link to={routes.documents} className="link-default">{t("dashboard.viewDetails")}</Link>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4 d-flex">
                    <div className="card flex-fill w-100">
                      <div className="card-body">
                        <span className="avatar rounded-circle bg-info mb-2">
                          <Icon name="file-check" className="fs-16" />
                        </span>
                        <h6 className="fs-13 fw-medium text-default mb-1">{t("dashboard.activeDocuments")}</h6>
                        <h3 className="mb-3">{activeDocuments.toLocaleString()}</h3>
                        <Link to={routes.documents} className="link-default">{t("dashboard.viewDetails")}</Link>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-4 d-flex">
                    <div className="card flex-fill w-100">
                      <div className="card-body">
                        <span className="avatar rounded-circle bg-dark mb-2">
                          <Icon name="archive" className="fs-16" />
                        </span>
                        <h6 className="fs-13 fw-medium text-default mb-1">Archived Documents</h6>
                        <h3 className="mb-3">{archivedDocuments.toLocaleString()}</h3>
                        <Link to={routes.documents} className="link-default">View Details</Link>
                      </div>
                    </div>
                  </div>
                  {/* Notifications card - merged stat + list */}
                  <div className="col-6 col-md-4 d-flex">
                    <div className="card flex-fill w-100">
                      <div className="card-body">
                        <span className="avatar rounded-circle bg-warning mb-2">
                          <Icon name="bell" className="fs-16" />
                        </span>
                        <h6 className="fs-13 fw-medium text-default mb-1">{t("dashboard.notifications")}</h6>
                        <h3 className="mb-3">{unreadCount.toLocaleString()}</h3>
                        {notificationsLoading ? (
                          <div className="text-center py-2">
                            <Spinner size="sm" />
                          </div>
                        ) : notificationsError ? (
                          <div className="text-danger small mb-2">{notificationsError}</div>
                        ) : notifications.length > 0 ? (
                          <div className="mb-3">
                            <ul className="list-unstyled mb-0">
                              {notifications.slice(0, 3).map((n) => (
                                <li key={n.id} className="mb-2 pb-2 border-bottom">
                                  <div className="d-flex align-items-start justify-content-between">
                                    <div className="flex-grow-1 min-w-0">
                                      <h6 className="mb-0 fs-13 text-truncate">
                                        {!n.is_read && <span className="badge bg-primary rounded-pill me-1">New</span>}
                                        {n.title}
                                      </h6>
                                      <p className="mb-0 small text-muted text-truncate">{n.message}</p>
                                      <small className="text-muted">
                                        {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                                      </small>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <Link to={routes.notifications} className="link-default">View All</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xxl-8 mt-3 mt-xxl-0">
                <div className="card h-100">
                  <div className="card-header">
                    <h5 className="card-title mb-0">{t("dashboard.foldersByDepartment")}</h5>
                  </div>
                  <div className="card-body pb-2">
                    {foldersLoading ? (
                      <div className="text-center py-3">
                        <Spinner size="sm" />
                      </div>
                    ) : chartData.categories.length === 0 ? (
                      <div className="text-center py-3 text-muted small">No folder data</div>
                    ) : (
                      <ReactApexChart
                        options={chartOptions}
                        series={chartOptions.series}
                        type="bar"
                        height={235}
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

export default DashboardPage;
