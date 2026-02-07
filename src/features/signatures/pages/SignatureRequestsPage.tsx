import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Spinner, Alert, Icon } from "../../../shared/components/ui";
import { useSignatureRequestsPageContainer } from "../containers/useSignatureRequestsPageContainer";
import "../styles/signatures.css";

/**
 * SignatureRequestsPage - Signature requests management page
 */
const SignatureRequestsPage = () => {
  const { routes, requests, isLoading, error, tab, setTab, processingId, handleApprove, handleReject, handleRetry } =
    useSignatureRequestsPageContainer();

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">Signature Requests</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Signatures
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
                onClick={() => setTab("pending")}
              >
                Pending
              </button>
              <button
                className={`btn btn-sm ${tab === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setTab("all")}
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
                                  onClick={() => handleApprove(sig.id)}
                                  disabled={processingId === sig.id || isLoading}
                                >
                                  {processingId === sig.id ? "Processing..." : "Approve"}
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleReject(sig.id)}
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
      </div>
    </div>
  );
};

export default SignatureRequestsPage;
