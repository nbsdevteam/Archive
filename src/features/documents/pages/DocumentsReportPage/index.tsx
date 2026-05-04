import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { PageLayout } from "@/shared/layout/PageLayout";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { PaginationSection } from "@/shared/components/PaginationSection";
import { Button, Icon, Spinner, DataTable } from "@/shared/components/ui";
import type { ColumnDef } from "@/shared/components/ui";
import { TruncatedCell } from "@/shared/components/ui/DataTable/datatableShared";
import { all_routes } from "@/router/all_routes";
import { getDocumentsReport } from "@/app/adapter/api/documents";
import "@/features/documents/styles/documents.css";
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

/** Filter by folder document role (backend `document_role` param). */
const DOCUMENT_ROLE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "main", label: "Main" },
  { value: "sub", label: "Sub" },
  { value: "attachment", label: "Attachment" },
  { value: "other", label: "Other" },
] as const;

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
  document_role: "",
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
  if (form.document_role) p.document_role = form.document_role;
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

/** Compact badge for folder document role (main / sub / attachment / other). */
function DocumentRoleBadge({ role }: { role: string }) {
  const r = (role || "").toLowerCase();
  const map: Record<string, string> = {
    main: "bg-primary-subtle text-primary",
    sub: "bg-secondary-subtle text-secondary",
    attachment: "bg-info-subtle text-info",
    other: "bg-light text-dark border",
  };
  const cls = map[r] ?? "bg-secondary-subtle text-secondary";
  return <span className={`badge ${cls} text-capitalize`}>{role || "—"}</span>;
}

/**
 * Role column: badge, optional parent id, optional attachment flag.
 */
function DocumentRoleCell({ doc }: { doc: ReportDocument }) {
  const role = doc.document_role;
  if (!role || !String(role).trim()) {
    return (
      <div className="drp-role-cell">
        <span className="text-muted">—</span>
        {doc.parent_document_id != null && (
          <div className="text-muted fs-11 mt-1">Parent #{doc.parent_document_id}</div>
        )}
        {doc.is_attachment === true && (
          <div className="d-flex align-items-center gap-1 text-muted fs-11 mt-1">
            <Icon name="paperclip" style={{ width: "0.75em", height: "0.75em" }} />
            <span>Flagged attachment</span>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="drp-role-cell">
      <DocumentRoleBadge role={String(role)} />
      {doc.parent_document_id != null && (
        <div className="text-muted fs-11 mt-1">Parent #{doc.parent_document_id}</div>
      )}
      {doc.is_attachment === true && (
        <div className="d-flex align-items-center gap-1 text-muted fs-11 mt-1">
          <Icon name="paperclip" style={{ width: "0.75em", height: "0.75em" }} />
          <span>Flagged attachment</span>
        </div>
      )}
    </div>
  );
}

/**
 * DocumentsReportPage – full-page report tool.
 *
 * Form phase: filter card only (all fields optional).
 * Loading phase: single loading card (filter card is replaced).
 * Results phase: results card only — summary, client-side search, DataTable
 *   (Name column keeps copy icon; other columns use ellipsis + InfoWrapper tooltip).
 */
const DocumentsReportPage = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<ReportParams>(DEFAULT_FORM);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [search, setSearch] = useState("");

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

  /** Change server page size (matches Documents list); resets to page 1 and refetches. */
  const handlePerPageChange = useCallback(
    async (newPerPage: number) => {
      if (!result) return;
      const per = Math.min(500, Math.max(1, newPerPage));
      setPageLoading(true);
      setError(null);
      try {
        const data = await getDocumentsReport(buildPayload({ ...form, per_page: per, page: 1 }));
        setForm((prev) => ({ ...prev, per_page: per, page: 1 }));
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to change page size");
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

  /** Client-side search across visible row text (including role and parent id). */
  const displayedData = useMemo(() => {
    if (!result?.data) return [];
    if (!search.trim()) return result.data;
    const q = search.toLowerCase();
    return result.data.filter((d) => {
      const parentStr = d.parent_document_id != null ? String(d.parent_document_id) : "";
      const roleStr = d.document_role ? String(d.document_role).toLowerCase() : "";
      return (
        d.name?.toLowerCase().includes(q) ||
        d.barcode?.toLowerCase().includes(q) ||
        d.uploader_name?.toLowerCase().includes(q) ||
        d.department_name?.toLowerCase().includes(q) ||
        d.company_name?.toLowerCase().includes(q) ||
        (d.folder_name != null && String(d.folder_name).toLowerCase().includes(q)) ||
        d.document_type_name?.toLowerCase().includes(q) ||
        (roleStr && roleStr.includes(q)) ||
        parentStr.includes(q)
      );
    });
  }, [result?.data, search]);

  /** DataTable column definitions – Name gets flexible width; others max-width + truncate + tooltip. */
  const columns = useMemo<ColumnDef<ReportDocument>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        width: "min(32vw, 22rem)",
        className: "drm-td-name",
        headerClassName: "drm-th-name",
        render: (doc) => (
          <div className="drm-name-cell">
            <TruncatedCell>
              <span className="drm-name-inner">{doc.name}</span>
            </TruncatedCell>
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
        id: "document_role",
        header: "Role",
        width: "8.5rem",
        headerClassName: "align-top",
        className: "align-top",
        render: (doc) => <DocumentRoleCell doc={doc} />,
      },
      {
        id: "barcode",
        header: "Barcode",
        width: "8rem",
        truncate: true,
        render: (doc) => <code className="fs-12">{doc.barcode}</code>,
      },
      {
        id: "upload_date",
        header: "Upload Date",
        width: "7.5rem",
        truncate: true,
        render: (doc) => formatDate(doc.upload_date),
      },
      {
        id: "uploader_name",
        header: "Uploader",
        width: "9rem",
        truncate: true,
        render: (doc) => doc.uploader_name,
      },
      {
        id: "department_name",
        header: "Department",
        width: "9rem",
        truncate: true,
        render: (doc) => doc.department_name,
      },
      {
        id: "document_type_name",
        header: "Doc Type",
        width: "8rem",
        truncate: true,
        render: (doc) => doc.document_type_name,
      },
      {
        id: "company_name",
        header: "Company",
        width: "8rem",
        truncate: true,
        render: (doc) => doc.company_name || "—",
      },
      {
        id: "folder_name",
        header: "Folder",
        width: "9rem",
        truncate: true,
        render: (doc) => doc.folder_name || "—",
      },
      {
        id: "confidentiality_level",
        header: "Confidentiality",
        width: "7.5rem",
        truncate: true,
        render: (doc) => <ConfidentialityBadge level={doc.confidentiality_level} />,
      },
      {
        id: "state",
        header: "State",
        width: "5.5rem",
        truncate: true,
        render: (doc) => <StateBadge state={doc.state} />,
      },
      {
        id: "version_count",
        header: "Ver.",
        width: "3rem",
        headerClassName: "text-center",
        className: "text-center",
        truncate: true,
        render: (doc) => String(doc.version_count),
      },
      {
        id: "ocr_status",
        header: "OCR",
        width: "6rem",
        truncate: true,
        render: (doc) => <OcrBadge status={doc.ocr_status} />,
      },
    ],
    []
  );

  return (
    <PageLayout
      title="Documents Report"
      breadcrumbItems={[
        { label: "Documents", to: all_routes.documents },
      ]}
      homeTo={all_routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
      {/* ── Form: filter card only (replaced by loading / results after submit) ── */}
      {phase === "form" && (
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
                    onChange={(e) => setField("from_date", e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13">To Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={form.to_date ?? ""}
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
                  <label className="form-label fs-13">Document role</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.document_role ?? ""}
                    onChange={(e) => setField("document_role", e.target.value)}
                  >
                    {DOCUMENT_ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-muted fs-11 mb-0 mt-1">
                    Filter by main / sub / attachment / other within folder context.
                  </p>
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
          <Button
            variant="outline"
            size="md"
            className="btn-outline-secondary d-inline-flex align-items-center"
            onClick={() => navigate(all_routes.documents)}
          >
            <Icon name="arrow-left" className="me-1" />
            Back to Documents
          </Button>
          <Button variant="primary" size="md" onClick={() => void handleSubmit()}>
            Submit
          </Button>
        </div>
      </div>
      )}

      {/* ── Loading: replaces filter UI until the API responds ───── */}
      {phase === "loading" && (
        <div className="card mb-3">
          <div className="drp-card-header">
            <div className="d-flex align-items-center gap-3">
              <div className="drp-card-header__icon">
                <Icon name="bar-chart-2" />
              </div>
              <div>
                <h5 className="mb-0 fw-semibold text-white lh-1">Fetching report</h5>
                <p className="mb-0 drp-card-header__subtitle">
                  Please wait while documents are loaded…
                </p>
              </div>
            </div>
          </div>
          <div className="card-body d-flex flex-column align-items-center justify-content-center py-5 gap-3">
            <Spinner size="lg" />
            <p className="text-muted mb-0 fs-14">Fetching documents report…</p>
          </div>
        </div>
      )}

      {/* ── Results: replaces filter / loading (summary + search + table) ─ */}
      {phase === "results" && result && (
        <div className="card documents__table-card drp-results-card mb-3">
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

          {/* Table body — match Documents list card body (min height + full-width scroll) */}
          <div className="card-body h-min-50vh p-0">
            {pageLoading && (
              <div className="d-flex align-items-center gap-2 px-3 py-2 text-muted fs-13 border-bottom">
                <Spinner size="sm" />
                Loading page…
              </div>
            )}
            {error && (
              <div className="alert alert-danger m-3 mb-0 fs-13 py-2">{error}</div>
            )}
            <div className="drm-table-wrap drm-table-wrap--page">
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

          {/* Pagination + per page (Documents list pattern); always show in results so page size is controllable even when total is 0 */}
          {result.pagination && (
            <PaginationSection
              page={result.pagination.page ?? 1}
              perPage={result.pagination.per_page ?? form.per_page ?? 50}
              total={result.pagination.total}
              totalPages={result.pagination.total_pages}
              onPageChange={(p) => void handlePageChange(p)}
              onPerPageChange={(per) => void handlePerPageChange(per)}
              disabled={pageLoading}
              perPageOptions={[10, 20, 50, 100, 200, 500]}
            />
          )}

          {/* Card footer: list actions only */}
          <div className="card-footer d-flex align-items-center justify-content-end gap-2 flex-wrap">
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
      )}
    </PageLayout>
  );
};

export default DocumentsReportPage;
