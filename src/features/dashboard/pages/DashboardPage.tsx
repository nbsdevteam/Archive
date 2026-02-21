import { useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Button, Spinner, Alert, Card, Icon } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { UploadDocumentSidePanel } from "../../documents/components";
/** Lazy-loaded so charts-vendor (ApexCharts) only loads when dashboard charts are visible. */
const DepartmentDonutChart = lazy(() =>
  import("../components/DepartmentDonutChart").then((m) => ({ default: m.DepartmentDonutChart }))
);
import { useDashboardPageContainer } from "../containers/useDashboardPageContainer";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsContext";
import { SHORTCUT_KEYS } from "@/shared/shortcuts/shortcutsRegistry";
import "../styles/dashboard.css";

/**
 * DashboardPage - Unified dashboard (canonical /dashboard).
 * Welcome back Admin, compact cards + Folders by Department chart on same row, notifications list.
 */
const DashboardPage = () => {
  const { t } = useTranslation();
  const { registerHandler } = useShortcuts();
  const routes = all_routes;
  const {
    stats,
    statsError,
    uploadPanelOpen,
    foldersLoading,
    foldersError,
    notifications,
    unreadCount,
    notificationsLoading,
    notificationsError,
    activeDocumentsCount,
    archivedDocumentsCount,
    trashedDocumentsCount,
    totalFolders,
    documentsByDepartment,
    foldersByDepartmentItems,
    loading,
    hasError,
    handleOpenUploadPanel,
    handleCloseUploadPanel,
    refreshDashboardCounts,
  } = useDashboardPageContainer();

  useEffect(() => {
    registerHandler(SHORTCUT_KEYS.NEW_DOCUMENT, () => handleOpenUploadPanel());
    return () => registerHandler(SHORTCUT_KEYS.NEW_DOCUMENT, undefined);
  }, [registerHandler, handleOpenUploadPanel]);

  const pageTitle = t("dashboard.title", { defaultValue: "Dashboard" });

  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[]}
      homeTo={routes.dashboard}
      rightContent={<CollapseHeader />}
    >
        {hasError && (
          <Alert variant="danger" className="mb-3">
            {statsError || foldersError || notificationsError}
          </Alert>
        )}

        {/* Welcome + quick actions */}
        <div className="card border-0 mb-3">
          <div className="card-body d-flex align-items-center justify-content-between flex-wrap pb-1">
            <div>
              <h1 className="mb-2">{t("dashboard.welcomeBackAdmin", { defaultValue: "Welcome back Admin" })}</h1>
              <p className="mb-0">
                You have{" "}
                <Link to={routes.notifications} className="text-primary text-decoration-underline">
                  <span className="Num">{unreadCount}</span> unread notification{unreadCount !== 1 ? "s" : ""}
                </Link>
              </p>
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <Button variant="outline" size="md" className="btn-outline-secondary" onClick={handleOpenUploadPanel} data-testid="upload-document-btn">
                <Icon name="file-up" className="me-1" />
                {t("dashboard.uploadDocument")}
              </Button>
              <Link to={routes.notifications} className="btn btn-outline-secondary control-height-md d-inline-flex align-items-center px-3">
                <Icon name="bell" className="me-1" />
                {t("dashboard.viewNotifications")}
              </Link>
            </div>
          </div>
        </div>

        <UploadDocumentSidePanel
          isOpen={uploadPanelOpen}
          onClose={handleCloseUploadPanel}
          onSuccess={refreshDashboardCounts}
        />

        {/* Cards + Chart on same row (compact cards) */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner size="md" />
          </div>
        ) : (
          <>
            {/* Grid layout: stat cards (fixed-size + wrap) + 2 donut cards in same row */}
            <div className="row mb-3 align-items-stretch g-3 dashboard-top-grid">
              <div className="col-12 col-xxl-4">
                <div className="dashboard-stat-grid">
                  <div className="dashboard-stat-grid__item d-flex">
                    <Link to={routes.folders} className="dashboard-stat-card-link flex-fill">
                      <Card className="flex-fill" glassEffect>
                        <span className="avatar rounded-circle bg-primary mb-2">
                          <Icon name="folder" className="fs-16" />
                        </span>
                        <h2 className="fs-13 fw-medium text-default mb-1">{t("dashboard.totalFolders")}</h2>
                        <h3 className="mb-2 Num" onClick={stopPropagation}>{totalFolders.toLocaleString()}</h3>
                        <span className="link-default">{t("dashboard.viewDetails")}</span>
                      </Card>
                    </Link>
                  </div>
                  <div className="dashboard-stat-grid__item d-flex">
                    <Link to={routes.documents} className="dashboard-stat-card-link flex-fill">
                      <Card className="flex-fill" glassEffect>
                        <span className="avatar rounded-circle bg-info mb-2">
                          <Icon name="file-check" className="fs-16" />
                        </span>
                        <h2 className="fs-13 fw-medium text-default mb-1">{t("dashboard.activeDocuments")}</h2>
                        <h3 className="mb-2 Num" onClick={stopPropagation}>{activeDocumentsCount.toLocaleString()}</h3>
                        <span className="link-default">{t("dashboard.viewDetails")}</span>
                      </Card>
                    </Link>
                  </div>
                  <div className="dashboard-stat-grid__item d-flex">
                    <Link to={routes.archivedDocuments} className="dashboard-stat-card-link flex-fill">
                      <Card className="flex-fill" glassEffect>
                        <span className="avatar rounded-circle bg-dark mb-2">
                          <Icon name="archive" className="fs-16" />
                        </span>
                        <h2 className="fs-13 fw-medium text-default mb-1">{t("dashboard.archivedDocuments")}</h2>
                        <h3 className="mb-2 Num" onClick={stopPropagation}>{archivedDocumentsCount.toLocaleString()}</h3>
                        <span className="link-default">{t("dashboard.viewDetails")}</span>
                      </Card>
                    </Link>
                  </div>
                  <div className="dashboard-stat-grid__item d-flex">
                    <Link to={routes.documentsTrash} className="dashboard-stat-card-link flex-fill">
                      <Card className="flex-fill" glassEffect>
                        <span className="avatar rounded-circle bg-danger-subtle text-danger mb-2">
                          <Icon name="trash-2" className="fs-16" />
                        </span>
                        <h2 className="fs-13 fw-medium text-default mb-1">{t("dashboard.trashedDocuments")}</h2>
                        <h3 className="mb-2 Num" onClick={stopPropagation}>{trashedDocumentsCount.toLocaleString()}</h3>
                        <span className="link-default">{t("dashboard.viewDetails")}</span>
                      </Card>
                    </Link>
                  </div>
                  <div className="dashboard-stat-grid__item d-flex">
                    <Link to={routes.notifications} className="dashboard-stat-card-link flex-fill">
                      <Card className="flex-fill" glassEffect>
                        <span className="avatar rounded-circle bg-warning mb-2">
                          <Icon name="bell" className="fs-16" />
                        </span>
                        <h2 className="fs-13 fw-medium text-default mb-1">{t("dashboard.notifications")}</h2>
                        <h3 className="mb-2 Num" onClick={stopPropagation}>{unreadCount.toLocaleString()}</h3>
                        {notificationsLoading ? (
                          <div className="text-center py-2">
                            <Spinner size="sm" />
                          </div>
                        ) : notificationsError ? (
                          <div className="text-danger small mb-2">{notificationsError}</div>
                        ) : notifications.length > 0 ? (
                          <div className="mb-2">
                            <ul className="list-unstyled mb-0">
                              {notifications.slice(0, 3).map((n) => (
                                <li key={n.id} className="mb-2 pb-2 border-bottom">
                                  <div className="d-flex align-items-start justify-content-between">
                                    <div className="flex-grow-1 min-w-0">
                                      <h4 className="mb-0 fs-13 text-truncate">
                                        {!n.is_read && <span className="badge bg-primary rounded-pill me-1">{t("app.new")}</span>}
                                        {n.title}
                                      </h4>
                                      <p className="mb-0 small text-muted text-truncate">{n.message}</p>
                                      <small className="text-muted">
                                        {n.created_at ?? ""}
                                      </small>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <span className="link-default">{t("app.viewAll")}</span>
                      </Card>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-xxl-4">
                <Card title={t("dashboard.documentsByDepartment")} className="h-100 dashboard-donut-card">
                  <div className="pb-2">
                    {stats === null && !statsError ? (
                      <div className="text-center py-3">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      <>
                        <Suspense fallback={<div style={{ height: 300 }} aria-hidden />}>
                          <DepartmentDonutChart items={documentsByDepartment} />
                        </Suspense>
                        <div className="dashboard-donut-info mt-3 px-2">
                          <h4 className="dashboard-donut-info__label mb-2">{t("app.overview")}</h4>
                          <p className="dashboard-donut-info__text mb-0">
                            This visualization displays the distribution of documents across all departments in your organization. 
                            Use this data to identify departments with the highest document volume, track content growth patterns, 
                            and ensure balanced resource allocation. The percentage breakdown helps you quickly assess departmental 
                            activity and make informed decisions about archiving strategies.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </div>
              <div className="col-12 col-md-6 col-xxl-4">
                <Card title={t("dashboard.foldersByDepartment")} className="h-100 dashboard-donut-card">
                  <div className="pb-2">
                    {foldersLoading ? (
                      <div className="text-center py-3">
                        <Spinner size="sm" />
                      </div>
                    ) : (
                      <>
                        <Suspense fallback={<div style={{ height: 300 }} aria-hidden />}>
                          <DepartmentDonutChart items={foldersByDepartmentItems} />
                        </Suspense>
                        <div className="dashboard-donut-info mt-3 px-2">
                          <h4 className="dashboard-donut-info__label mb-2">{t("app.overview")}</h4>
                          <p className="dashboard-donut-info__text mb-0">
                            This chart shows how folders are organized across your departments, providing insights into content 
                            structure and storage patterns. Monitor which departments maintain the most folders, identify areas 
                            requiring additional organization, and track folder creation trends over time. This breakdown is 
                            essential for optimizing your archiving workflow and maintaining a well-structured document hierarchy.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
    </PageLayout>
  );
};

export default DashboardPage;
