import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { editRequestsApi } from "../../../app/adapter/api/editRequests.api";
import { handleApiError } from "../../../app/adapter/api/client";
import "../styles/edit-requests.css";
import { Spinner, Alert, Icon } from "../../../shared/components/ui";

/**
 * EditRequestsPage - Edit requests management page
 */
const EditRequestsPage = () => {
  const routes = all_routes;
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await editRequestsApi.getEditRequests();
      const list = Array.isArray(response?.data) ? response.data : [];
      setRequests(list);
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError(handleApiError(err));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await editRequestsApi.approveEditRequest(requestId);
      await loadRequests();
    } catch (err: any) {
      console.error("Failed to approve request:", err);
      setError(handleApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await editRequestsApi.rejectEditRequest(requestId, "Rejected by user");
      await loadRequests();
    } catch (err: any) {
      console.error("Failed to reject request:", err);
      setError(handleApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Edit Requests</h2>
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
                  className="btn btn-sm btn-outline-primary ms-2"
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
                              {req.request_date ? new Date(req.request_date).toLocaleDateString() : req.created_at ? new Date(req.created_at).toLocaleDateString() : "-"}
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
