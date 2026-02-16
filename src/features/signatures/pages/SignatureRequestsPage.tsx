import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Spinner, Alert } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useSignatureRequestsPageContainer } from "../containers/useSignatureRequestsPageContainer";
import "../styles/signatures.css";

/**
 * SignatureRequestsPage - Signature requests management page
 */
const SignatureRequestsPage = () => {
  const { routes, requests, isLoading, error, tab, setTab, processingId, handleApprove, handleReject, handleRetry } =
    useSignatureRequestsPageContainer();

  const handleSetTabPending = () => setTab("pending");
  const handleSetTabAll = () => setTab("all");
  const handleApproveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.sigId;
    if (id != null) handleApprove(Number(id));
  };
  const handleRejectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.sigId;
    if (id != null) handleReject(Number(id));
  };

  return (
    <PageLayout
      title="Signature Requests"
      breadcrumbItems={[]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
            <button
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={handleRetry}
            >
              Retry
            </button>
          </Alert>
        )}

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <div className="d-flex gap-2">
              <button
                className={`btn btn-sm ${tab === 'pending' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={handleSetTabPending}
              >
                Pending
              </button>
              <button
                className={`btn btn-sm ${tab === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={handleSetTabAll}
              >
                All
              </button>
            </div>
            <h5 className="card-title mb-0">Signature Requests</h5>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-4">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped mb-0">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Requester</th>
                      <th>Signer</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted">
                          No signature requests found
                        </td>
                      </tr>
                    ) : (
                      requests.map((sig) => (
                        <tr key={sig.id}>
                          <td>{sig.document_title || `Document #${sig.document_id}`}</td>
                          <td>{sig.requester_name || "-"}</td>
                          <td>{sig.signer_name || `User #${sig.signer_id || "-"}`}</td>
                          <td>
                            <span className={`badge bg-${sig.state === "pending" ? "warning" : sig.state === "approved" || sig.state === "signed" ? "success" : "danger"}`}>
                              {sig.state}
                            </span>
                          </td>
                          <td className="text-end">
                            {sig.state === "pending" && (
                              <>
                                <button
                                  className="btn btn-sm btn-success me-1"
                                  data-sig-id={sig.id}
                                  onClick={handleApproveClick}
                                  disabled={processingId === sig.id || isLoading}
                                >
                                  {processingId === sig.id ? "Processing..." : "Approve"}
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  data-sig-id={sig.id}
                                  onClick={handleRejectClick}
                                  disabled={processingId === sig.id || isLoading}
                                >
                                  {processingId === sig.id ? "Processing..." : "Reject"}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
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

export default SignatureRequestsPage;
