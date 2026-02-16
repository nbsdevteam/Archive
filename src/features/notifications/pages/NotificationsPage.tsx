import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Spinner, Alert } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import { useNotificationsPageContainer } from "../containers/useNotificationsPageContainer";
import "../styles/notifications.css";

/**
 * NotificationsPage - Notifications management page
 */
const NotificationsPage = () => {
  const { t } = useTranslation();
  const {
    routes,
    notifications,
    unreadCount,
    isLoading,
    error,
    filter,
    setFilter,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleRetry,
  } = useNotificationsPageContainer();

  const handleSetFilterAll = () => setFilter("all");
  const handleSetFilterUnread = () => setFilter("unread");
  const handleNotificationItemClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.dataset.notifId;
    const isRead = e.currentTarget.dataset.notifRead === "true";
    if (id != null && !isRead) handleMarkAsRead(Number(id));
  };

  return (
    <PageLayout
      title={t("app.notifications")}
      breadcrumbItems={[]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between notifications__header">
            <h5 className="card-title mb-0">{t("app.notifications")}</h5>
            <div className="notifications__headerRight btn-list d-flex flex-wrap align-items-center">
              <button
                className={`btn btn-sm control-height-sm d-inline-flex align-items-center ${filter === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={handleSetFilterAll}
              >
                {t("app.filterAll")}
              </button>
              <button
                className={`btn btn-sm control-height-sm d-inline-flex align-items-center ${filter === 'unread' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={handleSetFilterUnread}
              >
                {t("app.filterUnread")} ({unreadCount})
              </button>
              {filter === "all" && notifications.length > 0 && (
                <button
                  className="btn btn-sm control-height-sm btn-outline-secondary d-inline-flex align-items-center"
                  onClick={handleMarkAllAsRead}
                >
                  {t("app.markAllRead")}
                </button>
              )}
            </div>
          </div>
          <div className="card-body">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <button
                  className="btn btn-sm control-height-sm btn-outline-secondary d-inline-flex align-items-center ms-2"
                  onClick={handleRetry}
                >
                  {t("common.retry")}
                </button>
              </Alert>
            )}
            {isLoading ? (
              <div className="text-center py-4">
                <Spinner size="md" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4 text-muted notifications__state">
                {t("app.noNotificationsFound")}
              </div>
            ) : (
              <div className="list-group">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`list-group-item notifications__item ${!notif.is_read ? 'notifications__item--unread' : ''}`}
                    data-notif-id={notif.id}
                    data-notif-read={String(notif.is_read)}
                    onClick={handleNotificationItemClick}
                    style={{ cursor: !notif.is_read ? 'pointer' : 'default' }}
                  >
                    <div className="notifications__itemTitleRow">
                      <strong>{notif.title}</strong>
                      {!notif.is_read && <span className="badge bg-primary">{t("app.badgeNew")}</span>}
                    </div>
                    <div className="notifications__itemBody">
                      {notif.message}
                    </div>
                    <span className="text-muted notifications__itemTime">
                      {notif.created_at ? formatRelativeTime(new Date(notif.created_at)) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </PageLayout>
  );
};

export default NotificationsPage;
