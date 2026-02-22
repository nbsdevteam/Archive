import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { Alert, DataTable } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useSignatureRequestsPageContainer } from "../containers/useSignatureRequestsPageContainer";
import type { SignatureRequest } from "@/app/adapter/api/signatures.api";
import "../styles/signatures.css";

/**
 * SignatureRequestsPage - Signature requests management page.
 * Uses DataTable: table on desktop, cards on mobile (< 768px).
 */
const SignatureRequestsPage = () => {
  const { t } = useTranslation();
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

  const columns = useMemo(
    () => [
      {
        id: "document",
        header: t("app.document"),
        render: (row: SignatureRequest) => row.document_title || `Document #${row.document_id}`,
      },
      {
        id: "requester",
        header: t("app.requester"),
        render: (row: SignatureRequest) => row.requester_name || "–",
      },
      {
        id: "signer",
        header: t("app.signer"),
        render: (row: SignatureRequest) => row.signer_name || `User #${row.signer_id ?? "-"}`,
      },
      {
        id: "status",
        header: t("documents.status"),
        render: (row: SignatureRequest) => (
          <span
            className={`badge bg-${
              row.state === "pending"
                ? "warning"
                : row.state === "approved" || row.state === "signed"
                  ? "success"
                  : "danger"
            }`}
          >
            {row.state}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("common.actions"),
        headerClassName: "text-end",
        className: "text-end",
        render: (row: SignatureRequest) => {
          if (row.state !== "pending") return "–";
          return (
            <>
              <button
                type="button"
                className="btn btn-sm btn-success me-1"
                data-sig-id={row.id}
                onClick={handleApproveClick}
                disabled={processingId === row.id || isLoading}
              >
                {processingId === row.id ? t("app.processing") : t("app.approve")}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                data-sig-id={row.id}
                onClick={handleRejectClick}
                disabled={processingId === row.id || isLoading}
              >
                {processingId === row.id ? t("app.processing") : t("app.reject")}
              </button>
            </>
          );
        },
      },
    ],
    [t, processingId, isLoading, handleApprove, handleReject]
  );

  return (
    <PageLayout
      title={t("app.signatureRequests")}
      breadcrumbItems={[]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
          <button className="btn btn-sm btn-outline-secondary ms-2" onClick={handleRetry}>
            {t("common.retry")}
          </button>
        </Alert>
      )}

      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm ${tab === "pending" ? "btn-secondary" : "btn-outline-secondary"}`}
              onClick={handleSetTabPending}
            >
              {t("app.tabPending")}
            </button>
            <button
              className={`btn btn-sm ${tab === "all" ? "btn-secondary" : "btn-outline-secondary"}`}
              onClick={handleSetTabAll}
            >
              {t("app.filterAll")}
            </button>
          </div>
          <h5 className="card-title mb-0">{t("app.signatureRequests")}</h5>
        </div>
        <div className="card-body">
          <DataTable<SignatureRequest>
            data={requests}
            getRowId={(row) => row.id}
            columns={columns}
            loading={isLoading}
            emptyMessage={t("app.noSignatureRequestsFound")}
            responsive="auto"
            cardsBelow="md"
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default SignatureRequestsPage;
