import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import "../styles/edit-requests.css";
import { Spinner, Alert, Icon } from "../../../shared/components/ui";
import { formatApiTimestampInIraqi } from "../../../shared/utils/format/date";
import { useEditRequestsPageContainer } from "../containers/useEditRequestsPageContainer";

/**
 * EditRequestsPage - Edit requests management page
 */
const EditRequestsPage = () => {
  const { routes, requests, loading, error, processingId, loadRequests, handleApprove, handleReject } =
    useEditRequestsPageContainer();

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">Edit Requests</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Edit Requests
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
            <h5 className="card-title mb-0">Pending Edit Requests</h5>
          </div>
          <div className="card-body">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <button
                  className="btn btn-sm btn-outline-secondary ms-2"
                  onClick={loadRequests}
                >
                  Retry
                </button>
              </Alert>
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
                      <th>Requester</th>
                      <th>Document</th>
                      <th>Reason</th>
                      <th>Request Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted">
                          No edit requests found
                        </td>
                      </tr>
                    ) : (
                      requests.map((req) => {
                        const status = req.state || req.status || "unknown";
                        const isPending = status === "pending";
                        return (
                          <tr key={req.id}>
                            <td>{req.requester_name || `User #${req.requester_id || "-"}`}</td>
                            <td>{req.document_title || `Document #${req.document_id}`}</td>
                            <td>{req.reason || "-"}</td>
                            <td>
                              {req.request_date ? formatApiTimestampInIraqi(req.request_date) : req.created_at ? formatApiTimestampInIraqi(req.created_at) : "-"}
                            </td>
                            <td>
                              <span className={`badge bg-${isPending ? "warning" : status === "approved" ? "success" : "danger"}`}>
                                {status}
                              </span>
                            </td>
                            <td className="text-end">
                              {isPending && (
                                <>
                                  <button
                                    className="btn btn-sm btn-success me-1"
                                    onClick={() => handleApprove(req.id)}
                                    disabled={processingId === req.id}
                                  >
                                    {processingId === req.id ? "Processing..." : "Approve"}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleReject(req.id)}
                                    disabled={processingId === req.id}
                                  >
                                    {processingId === req.id ? "Processing..." : "Reject"}
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRequestsPage;
