import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import "../styles/edit-requests.css";
import { Spinner, Alert } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useEditRequestsPageContainer } from "../containers/useEditRequestsPageContainer";

/**
 * EditRequestsPage - Edit requests management page
 */
const EditRequestsPage = () => {
  const { routes, requests, loading, error, processingId, loadRequests, handleApprove, handleReject } =
    useEditRequestsPageContainer();

  const handleApproveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.requestId;
    if (id != null) handleApprove(Number(id));
  };
  const handleRejectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.requestId;
    if (id != null) handleReject(Number(id));
  };

  return (
    <PageLayout
      title="Edit Requests"
      breadcrumbItems={[]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
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
                        const status = req.state ?? req.status ?? "unknown";
                        const isPending = status === "pending";
                        return (
                          <tr key={req.id}>
                            <td>{req.requester_name || `User #${req.requester_id || "-"}`}</td>
                            <td>{req.document_title || `Document #${req.document_id}`}</td>
                            <td>{req.reason || "-"}</td>
                            <td>
                              {req.request_date ?? req.created_at ?? "-"}
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
                                    data-request-id={req.id}
                                    onClick={handleApproveClick}
                                    disabled={processingId === req.id}
                                  >
                                    {processingId === req.id ? "Processing..." : "Approve"}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    data-request-id={req.id}
                                    onClick={handleRejectClick}
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
    </PageLayout>
  );
};

export default EditRequestsPage;
