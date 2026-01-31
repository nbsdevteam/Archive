import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { useArchiveTrash } from "../hooks";
import { Icon } from "../../../shared/components/ui";

const ArchiveTrash = () => {
  const routes = all_routes;
  // Use container with static data by default (useApi=false)
  const { trashedItems, loading, error, restoreItem, deletePermanently, emptyTrash } = useArchiveTrash({ useApi: false });

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Trash</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Archive</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Trash
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
            <h5 className="card-title mb-0">Recently Deleted</h5>
            <button
              className="btn btn-light btn-sm"
              onClick={() => emptyTrash()}
            >
              Empty Trash
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Deleted</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="text-center text-danger">
                        {error}
                      </td>
                    </tr>
                  ) : trashedItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        No trashed items
                      </td>
                    </tr>
                  ) : (
                    trashedItems.map((item: { id?: number; name: string; type: string; updated: string }, idx: number) => (
                      <tr key={item.id || item.name || idx}>
                        <td>{item.name}</td>
                        <td>{item.type}</td>
                        <td>{item.updated}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-light me-1"
                            onClick={() => item.id && restoreItem(item.id)}
                          >
                            Restore
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => item.id && deletePermanently(item.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveTrash;
