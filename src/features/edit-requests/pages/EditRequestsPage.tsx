import { useMemo } from "react";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import "../styles/edit-requests.css";
import { Alert, DataTable } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useEditRequestsPageContainer } from "../containers/useEditRequestsPageContainer";
import type { EditRequest } from "@/app/adapter/api/editRequests.api";

/**
 * EditRequestsPage - Edit requests management page.
 * Uses DataTable: table on desktop, cards on mobile (< 768px).
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

  const columns = useMemo(
    () => [
      {
        id: "requester",
        header: "Requester",
        render: (row: EditRequest) => row.requester_name || `User #${row.requester_id ?? "-"}`,
      },
      {
        id: "document",
        header: "Document",
        render: (row: EditRequest) => row.document_title || `Document #${row.document_id}`,
      },
      {
        id: "reason",
        header: "Reason",
        render: (row: EditRequest) => row.reason ?? "–",
      },
      {
        id: "request_date",
        header: "Request Date",
        render: (row: EditRequest) => row.request_date ?? row.created_at ?? "–",
      },
      {
        id: "status",
        header: "Status",
        render: (row: EditRequest) => {
          const status = row.state ?? row.status ?? "unknown";
          const isPending = status === "pending";
          return (
            <span className={`badge bg-${isPending ? "warning" : status === "approved" ? "success" : "danger"}`}>
              {status}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "text-end",
        className: "text-end",
        render: (row: EditRequest) => {
          const status = row.state ?? row.status ?? "unknown";
          const isPending = status === "pending";
          if (!isPending) return "–";
          return (
            <>
              <button
                type="button"
                className="btn btn-sm btn-success me-1"
                data-request-id={row.id}
                onClick={handleApproveClick}
                disabled={processingId === row.id}
              >
                {processingId === row.id ? "Processing..." : "Approve"}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                data-request-id={row.id}
                onClick={handleRejectClick}
                disabled={processingId === row.id}
              >
                {processingId === row.id ? "Processing..." : "Reject"}
              </button>
            </>
          );
        },
      },
    ],
    [processingId, handleApprove, handleReject]
  );

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
          <DataTable<EditRequest>
            data={requests}
            getRowId={(row) => row.id}
            columns={columns}
            loading={loading}
            emptyMessage="No edit requests found"
            responsive="auto"
            cardsBelow="md"
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default EditRequestsPage;
