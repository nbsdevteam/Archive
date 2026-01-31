import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { useArchiveActivity } from "../hooks";
import { Icon } from "../../../shared/components/ui";

const ArchiveActivity = () => {
  const routes = all_routes;
  // Use container with static data by default (useApi=false)
  const { activities, loading, error, exportActivities } = useArchiveActivity({ useApi: false });

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Activity</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Archive</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Activity
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
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">Recent Activity</h5>
            <button
              className="btn btn-light btn-sm"
              onClick={() => exportActivities()}
            >
              Export
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-4">
                <p className="text-muted">Loading activities...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">No activities found</p>
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {activities.map((activity: { action: string; item: string; when: string }, idx: number) => (
                  <li
                    key={`${activity.action}-${activity.item}-${idx}`}
                    className="list-group-item px-0 d-flex justify-content-between"
                  >
                    <span>
                      <strong>{activity.action}:</strong> {activity.item}
                    </span>
                    <span className="text-muted fs-12">{activity.when}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveActivity;
