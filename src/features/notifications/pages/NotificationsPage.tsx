import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Spinner, Alert, Icon } from "../../../shared/components/ui";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import { useNotificationsPageContainer } from "../containers/useNotificationsPageContainer";
import "../styles/notifications.css";

/**
 * NotificationsPage - Notifications management page
 */
const NotificationsPage = () => {
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

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">Notifications</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Notifications
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

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between notifications__header">
            <h5 className="card-title mb-0">Notifications</h5>
            <div className="notifications__headerRight btn-list d-flex flex-wrap align-items-center">
              <button
                className={`btn btn-sm control-height-sm d-inline-flex align-items-center ${filter === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`btn btn-sm control-height-sm d-inline-flex align-items-center ${filter === 'unread' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter("unread")}
              >
                Unread ({unreadCount})
              </button>
              {filter === "all" && notifications.length > 0 && (
                <button
                  className="btn btn-sm control-height-sm btn-outline-secondary d-inline-flex align-items-center"
                  onClick={handleMarkAllAsRead}
                >
                  Mark All Read
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
                  Retry
                </button>
              </Alert>
            )}
            {isLoading ? (
              <div className="text-center py-4">
                <Spinner size="md" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4 text-muted notifications__state">
                No notifications found
              </div>
            ) : (
              <div className="list-group">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`list-group-item notifications__item ${!notif.is_read ? 'notifications__item--unread' : ''}`}
                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                    style={{ cursor: !notif.is_read ? 'pointer' : 'default' }}
                  >
                    <div className="notifications__itemTitleRow">
                      <strong>{notif.title}</strong>
                      {!notif.is_read && <span className="badge bg-primary">New</span>}
                    </div>
                    <div className="notifications__itemBody">
                      {notif.message}
                    </div>
                    <span className="text-muted notifications__itemTime">
                      {formatRelativeTime(new Date(notif.created_at))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
