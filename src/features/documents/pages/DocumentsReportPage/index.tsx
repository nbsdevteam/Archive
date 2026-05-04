import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PageLayout } from "@/shared/layout/PageLayout";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { Button, Icon, Spinner, DataTable } from "@/shared/components/ui";
import type { ColumnDef } from "@/shared/components/ui";
import { all_routes } from "@/router/all_routes";
import { getDocumentsReport } from "@/app/adapter/api/documents";
import type {
  ReportParams,
  ReportResult,
  ReportDocument,
} from "@/app/adapter/api/documents/report";

type Phase = "form" | "loading" | "results";

const CONFIDENTIALITY_OPTIONS = [
  { value: "", label: "Any" },
  { value: "public", label: "Public" },
  { value: "internal", label: "Internal" },
  { value: "confidential", label: "Confidential" },
  { value: "strict", label: "Strict" },
];

const STATE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

const DEFAULT_FORM: ReportParams = {
  from_date: "",
  to_date: "",
  company_id: undefined,
  company_name: "",
  department_id: undefined,
  department_name: "",
  document_type_id: undefined,
  document_type: "",
  confidentiality_level: "",
  uploader_id: undefined,
  uploader_name: "",
  folder_id: undefined,
  folder_name: "",
  state: "active",
  page: 1,
  per_page: 50,
};

/** Strips empty / undefined values from the form to build a clean payload. */
function buildPayload(form: ReportParams): ReportParams {
  const p: ReportParams = {};
  if (form.from_date) p.from_date = form.from_date;
  if (form.to_date) p.to_date = form.to_date;
  if (form.company_id) p.company_id = Number(form.company_id);
  if (form.company_name) p.company_name = form.company_name;
  if (form.department_id) p.department_id = Number(form.department_id);
  if (form.department_name) p.department_name = form.department_name;
  if (form.document_type_id) p.document_type_id = Number(form.document_type_id);
  if (form.document_type) p.document_type = form.document_type;
  if (form.confidentiality_level) p.confidentiality_level = form.confidentiality_level;
  if (form.uploader_id) p.uploader_id = Number(form.uploader_id);
  if (form.uploader_name) p.uploader_name = form.uploader_name;
  if (form.folder_id) p.folder_id = Number(form.folder_id);
  if (form.folder_name) p.folder_name = form.folder_name;
  if (form.state) p.state = form.state;
  p.page = form.page ?? 1;
  p.per_page = Math.min(500, Math.max(1, form.per_page ?? 50));
  return p;
}

/** Formats an ISO datetime string to "DD MMM YYYY". */
function formatDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Copies text to clipboard and fires a toast confirmation. */
function copyToClipboard(text: string) {
  void navigator.clipboard
    .writeText(text)
    .then(() => toast.success("Copied to clipboard", { autoClose: 2000 }))
    .catch(() => toast.error("Failed to copy"));
}

/** Coloured badge for document confidentiality level. */
function ConfidentialityBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    public: "bg-success-subtle text-success",
    internal: "bg-primary-subtle text-primary",
    confidential: "bg-warning-subtle text-warning",
    strict: "bg-danger-subtle text-danger",
  };
  const cls = map[level?.toLowerCase()] ?? "bg-secondary-subtle text-secondary";
  return <span className={`badge ${cls} text-capitalize`}>{level || "—"}</span>;
}

/** Coloured badge for document state. */
function StateBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    active: "bg-success-subtle text-success",
    archived: "bg-secondary-subtle text-secondary",
    trashed: "bg-danger-subtle text-danger",
  };
  const cls = map[state?.toLowerCase()] ?? "bg-secondary-subtle text-secondary";
  return <span className={`badge ${cls} text-capitalize`}>{state || "—"}</span>;
}

/** Coloured badge for OCR processing status. */
function OcrBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-success-subtle text-success",
    pending: "bg-warning-subtle text-warning",
    failed: "bg-danger-subtle text-danger",
    processing: "bg-info-subtle text-info",
  };
  const cls = map[status?.toLowerCase()] ?? "bg-secondary-subtle text-secondary";
  return <span className={`badge ${cls} text-capitalize`}>{status || "—"}</span>;
}

/**
 * DocumentsReportPage – full-page report tool.
 *
 * Top card: optional filter form (all fields optional; Submit fetches all
 *   docs up to today when left empty).
 * Bottom card: appears after a successful fetch; shows an inline summary
 *   strip, a client-side search bar, and the DataTable with a copy-to-clipboard
 *   icon in the Name column. Pagination prev/next sit on the opposite side of
 *   the New Search / Back buttons so the layout works naturally in both LTR
 *   and RTL modes.
 */
const DocumentsReportPage = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<ReportParams>(DEFAULT_FORM);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [search, setSearch] = useState("");

  /** Detect current document direction for RTL-aware pagination layout. */
  const isRtl = document.documentElement.dir === "rtl";

  /** Generic form field setter. */
  const setField = <K extends keyof ReportParams>(key: K, value: ReportParams[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Fetch the report using the current form values. */
  const handleSubmit = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setSearch("");
    try {
      const data = await getDocumentsReport(buildPayload({ ...form, page: 1 }));
      setForm((prev) => ({ ...prev, page: 1 }));
      setResult(data);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch report");
      setPhase("form");
    }
  }, [form]);

  /** Navigate to a different results page. */
  const handlePageChange = useCallback(
    async (newPage: number) => {
      if (!result) return;
      setPageLoading(true);
      setError(null);
      try {
        const data = await getDocumentsReport(buildPayload({ ...form, page: newPage }));
        setForm((prev) => ({ ...prev, page: newPage }));
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load page");
      } finally {
        setPageLoading(false);
      }
    },
    [form, result]
  );

  /** Reset to the filter form without clearing field values (so user can refine). */
  const handleNewSearch = useCallback(() => {
    setPhase("form");
    setResult(null);
    setError(null);
    setSearch("");
  }, []);

  /** Client-side search: matches name, barcode, uploader, or department. */
  const displayedData = useMemo(() => {
    if (!result?.data) return [];
    if (!search.trim()) return result.data;
    const q = search.toLowerCase();
    return result.data.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.barcode?.toLowerCase().includes(q) ||
        d.uploader_name?.toLowerCase().includes(q) ||
        d.department_name?.toLowerCase().includes(q)
    );
  }, [result?.data, search]);

  /** DataTable column definitions – memoised so render is stable. */
  const columns = useMemo<ColumnDef<ReportDocument>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        width: "280px",
        render: (doc) => (
          <div className="drm-name-cell">
            <span className="drm-name-text" title={doc.name}>
              {doc.name}
            </span>
            <button
              type="button"
              className="drm-copy-btn"
              title="Copy name"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(doc.name);
              }}
            >
              <Icon name="copy" />
            </button>
          </div>
        ),
      },
      {
        id: "barcode",
        header: "Barcode",
        width: "140px",
        render: (doc) => <code className="fs-12">{doc.barcode}</code>,
      },
      {
        id: "upload_date",
        header: "Upload Date",
        width: "110px",
        render: (doc) => (
          <span className="text-nowrap fs-12">{formatDate(doc.upload_date)}</span>
        ),
      },
      {
        id: "uploader_name",
        header: "Uploader",
        width: "120px",
        render: (doc) => doc.uploader_name,
      },
      {
        id: "department_name",
        header: "Department",
        width: "130px",
        render: (doc) => doc.department_name,
      },
      {
        id: "document_type_name",
        header: "Doc Type",
        width: "110px",
        render: (doc) => doc.document_type_name,
      },
      {
        id: "company_name",
        header: "Company",
        width: "110px",
        render: (doc) => doc.company_name || <span className="text-muted">—</span>,
      },
      {
        id: "folder_name",
        header: "Folder",
        width: "120px",
        render: (doc) => doc.folder_name || <span className="text-muted">—</span>,
      },
      {
        id: "confidentiality_level",
        header: "Confidentiality",
        width: "120px",
        render: (doc) => <ConfidentialityBadge level={doc.confidentiality_level} />,
      },
      {
        id: "state",
        header: "State",
        width: "90px",
        render: (doc) => <StateBadge state={doc.state} />,
      },
      {
        id: "version_count",
        header: "Ver.",
        width: "60px",
        headerClassName: "text-center",
        className: "text-center",
        render: (doc) => doc.version_count,
      },
      {
        id: "ocr_status",
        header: "OCR",
        width: "90px",
        render: (doc) => <OcrBadge status={doc.ocr_status} />,
      },
    ],
    []
  );

  const hasPagination = result ? result.pagination.total_pages > 1 : false;
  const canPrev = result ? result.pagination.page > 1 && !pageLoading : false;
  const canNext = result
    ? result.pagination.page < result.pagination.total_pages && !pageLoading
    : false;

  return (
    <PageLayout
      title="Documents Report"
      breadcrumbItems={[
        { label: "Documents", to: all_routes.documents },
      ]}
      homeTo={all_routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
      {/* ── Filter card ────────────────────────────────────────── */}
      <div className="card mb-3">
        {/* Gradient card header */}
        <div className="drp-card-header">
          <div className="d-flex align-items-center gap-3">
            <div className="drp-card-header__icon">
              <Icon name="bar-chart-2" />
            </div>
            <div>
              <h5 className="mb-0 fw-semibold text-white lh-1">Filters</h5>
              <p className="mb-0 drp-card-header__subtitle">
                All fields are optional — leave empty to fetch all documents up to today
              </p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Info banner */}
          <div className="alert alert-info d-flex align-items-start gap-2 py-2 mb-4">
            <Icon name="info" className="flex-shrink-0 mt-1" />
            <span className="fs-13">
              When both an <strong>ID</strong> and a <strong>name</strong> are provided for
              the same filter, the ID takes priority.
            </span>
          </div>

          <div className="row g-3">
            {/* Date Range */}
            <div className="col-12">
              <p className="drp-section-label">Date Range</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">From Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={form.from_date ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) => setField("from_date", e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13">To Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={form.to_date ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) => setField("to_date", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Company */}
            <div className="col-12">
              <p className="drp-section-label">Company / Brand</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">Company ID</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="e.g. 7436"
                    value={form.company_id ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) =>
                      setField("company_id", e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13">Company Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. ALCAN"
                    value={form.company_name ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) => setField("company_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Department */}
            <div className="col-12">
              <p className="drp-section-label">Department</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">Department ID</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="e.g. 4"
                    value={form.department_id ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) =>
                      setField(
                        "department_id",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13">Department Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Supply Chain"
                    value={form.department_name ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) => setField("department_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Document Type */}
            <div className="col-12">
              <p className="drp-section-label">Document Type</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">Document Type ID</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="e.g. 5"
                    value={form.document_type_id ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) =>
                      setField(
                        "document_type_id",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13">Document Type Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Invoice"
                    value={form.document_type ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) => setField("document_type", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Uploader */}
            <div className="col-12">
              <p className="drp-section-label">Uploader</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">Uploader ID</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="e.g. 2"
                    value={form.uploader_id ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) =>
                      setField(
                        "uploader_id",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13">Uploader Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. admin"
                    value={form.uploader_name ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) => setField("uploader_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Folder */}
            <div className="col-12">
              <p className="drp-section-label">Folder</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">Folder ID</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="e.g. 45"
                    value={form.folder_id ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) =>
                      setField("folder_id", e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13">Folder Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. ALCAN-386"
                    value={form.folder_name ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) => setField("folder_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Additional filters */}
            <div className="col-12">
              <p className="drp-section-label">Additional Filters</p>
              <div className="row g-2">
                <div className="col-md-4">
                  <label className="form-label fs-13">Confidentiality Level</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.confidentiality_level ?? ""}
                    disabled={phase === "loading"}
                    onChange={(e) => setField("confidentiality_level", e.target.value)}
                  >
                    {CONFIDENTIALITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fs-13">State</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.state ?? "active"}
                    disabled={phase === "loading"}
                    onChange={(e) => setField("state", e.target.value)}
                  >
                    {STATE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fs-13">Results per page</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={1}
                    max={500}
                    value={form.per_page ?? 50}
                    disabled={phase === "loading"}
                    onChange={(e) =>
                      setField(
                        "per_page",
                        Math.min(500, Math.max(1, Number(e.target.value) || 50))
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mt-3 mb-0 fs-13 d-flex align-items-center gap-2">
              <Icon name="x" className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Card footer: actions */}
        <div className="card-footer d-flex align-items-center justify-content-end gap-2">
          {phase === "loading" ? (
            <div className="d-flex align-items-center gap-2 text-muted fs-13 me-auto">
              <Spinner size="sm" />
              Fetching documents report…
            </div>
          ) : null}
          <Button
            variant="outline"
            size="md"
            className="btn-outline-secondary d-inline-flex align-items-center"
            onClick={() => navigate(all_routes.documents)}
          >
            <Icon name="arrow-left" className="me-1" />
            Back to Documents
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={phase === "loading"}
            onClick={() => void handleSubmit()}
          >
            Submit
          </Button>
        </div>
      </div>

      {/* ── Results card (shown after successful fetch) ─────────── */}
      {phase === "results" && result && (
        <div className="card">
          {/* Summary stats strip as card-header */}
          <div className="card-header drp-results-header">
            <div className="drm-summary">
              <span className="drm-summary__item">
                <strong>Total Documents:</strong> {result.summary.total.toLocaleString()}
              </span>
              <span className="drm-summary__item">
                <strong>Pages:</strong> {result.pagination.total_pages}
              </span>
              <span className="drm-summary__item">
                <strong>From:</strong> {formatDate(result.summary.from_date)}
              </span>
              <span className="drm-summary__item">
                <strong>To:</strong> {formatDate(result.summary.to_date)}
              </span>
              {Object.keys(result.summary.filters ?? {}).length > 0 && (
                <span className="drm-summary__item">
                  <strong>Active Filters:</strong>{" "}
                  {Object.keys(result.summary.filters).length}
                </span>
              )}
            </div>

            {/* Inline search */}
            <div className="drp-results-search">
              <div className="input-group input-group-sm">
                <span className="input-group-text">
                  <Icon name="search" style={{ width: "0.85em", height: "0.85em" }} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, barcode, uploader, department…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setSearch("")}
                    title="Clear search"
                  >
                    <Icon name="x" style={{ width: "0.85em", height: "0.85em" }} />
                  </button>
                )}
              </div>
              {search && (
                <p className="text-muted fs-12 mt-1 mb-0">
                  Showing {displayedData.length} of {result.data.length} loaded results
                </p>
              )}
            </div>
          </div>

          {/* Table body */}
          <div className="card-body p-0">
            {pageLoading && (
              <div className="d-flex align-items-center gap-2 px-3 py-2 text-muted fs-13 border-bottom">
                <Spinner size="sm" />
                Loading page…
              </div>
            )}
            {error && (
              <div className="alert alert-danger m-3 mb-0 fs-13 py-2">{error}</div>
            )}
            <div className="drm-table-wrap">
              <DataTable<ReportDocument>
                data={displayedData}
                getRowId={(row) => row.id}
                columns={columns}
                loading={pageLoading}
                emptyMessage="No documents matched your filters."
                tableClassName="table table-hover table-sm mb-0 drm-table"
                responsive="table"
              />
            </div>
          </div>

          {/* Card footer: pagination (opposite side) + actions */}
          <div className="card-footer d-flex align-items-center justify-content-between gap-2">
            {/* Pagination group — left in LTR, right in RTL */}
            <div className={`d-flex gap-2 align-items-center ${isRtl ? "order-2" : "order-1"}`}>
              {hasPagination && (
                <>
                  <Button
                    variant="outline"
                    size="md"
                    className="btn-outline-secondary d-inline-flex align-items-center"
                    disabled={!canPrev}
                    onClick={() => void handlePageChange(result.pagination.page - 1)}
                  >
                    <Icon name="chevron-left" className="me-1" />
                    Prev
                  </Button>
                  <span className="fs-13 text-muted px-1">
                    {result.pagination.page} / {result.pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="md"
                    className="btn-outline-secondary d-inline-flex align-items-center"
                    disabled={!canNext}
                    onClick={() => void handlePageChange(result.pagination.page + 1)}
                  >
                    Next
                    <Icon name="chevron-right" className="ms-1" />
                  </Button>
                </>
              )}
            </div>

            {/* Action group — right in LTR, left in RTL */}
            <div className={`d-flex gap-2 ${isRtl ? "order-1" : "order-2"}`}>
              <Button
                variant="outline"
                size="md"
                className="btn-outline-secondary d-inline-flex align-items-center"
                onClick={handleNewSearch}
              >
                <Icon name="arrow-left" className="me-1" />
                New Search
              </Button>
              <Button
                variant="outline"
                size="md"
                className="btn-outline-secondary d-inline-flex align-items-center"
                onClick={() => navigate(all_routes.documents)}
              >
                <Icon name="arrow-left" className="me-1" />
                Back to Documents
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default DocumentsReportPage;
