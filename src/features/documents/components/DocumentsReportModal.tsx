import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Modal, Button, Icon, Spinner, DataTable, SearchInput } from "@/shared/components/ui";
import type { ColumnDef } from "@/shared/components/ui";
import { getDocumentsReport } from "@/app/adapter/api/documents";
import type { ReportParams, ReportResult, ReportDocument } from "@/app/adapter/api/documents/report";
import "@/features/documents/styles/documents.css";

interface DocumentsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

/** Formats an ISO date/datetime string to "DD MMM YYYY". */
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

/** Copies text to clipboard and fires a success toast. */
function copyToClipboard(text: string) {
  void navigator.clipboard
    .writeText(text)
    .then(() => toast.success("Copied to clipboard", { autoClose: 2000 }))
    .catch(() => toast.error("Failed to copy"));
}

/** Bootstrap badge variants for confidentiality level. */
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

/** Bootstrap badge for document state. */
function StateBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    active: "bg-success-subtle text-success",
    archived: "bg-secondary-subtle text-secondary",
    trashed: "bg-danger-subtle text-danger",
  };
  const cls = map[state?.toLowerCase()] ?? "bg-secondary-subtle text-secondary";
  return <span className={`badge ${cls} text-capitalize`}>{state || "—"}</span>;
}

/** Bootstrap badge for OCR status. */
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
 * DocumentsReportModal – fully refactored two-phase modal:
 *
 * Phase 1 (form): all optional filter fields at the top; Submit in footer.
 * Phase 2 (results): summary stats strip + search box + DataTable with a
 *   copy-to-clipboard icon on the Name column; pagination on the opposite
 *   side from New Search / Close to support both LTR and RTL layouts.
 */
export function DocumentsReportModal({ isOpen, onClose }: DocumentsReportModalProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<ReportParams>(DEFAULT_FORM);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [search, setSearch] = useState("");

  const noopDebouncedSearch = useCallback((_value: string) => {}, []);

  /** Detect current document direction for RTL-aware footer layout. */
  const isRtl = document.documentElement.dir === "rtl";

  /** Reset state and close the modal. */
  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setPhase("form");
      setResult(null);
      setError(null);
      setForm(DEFAULT_FORM);
      setSearch("");
    }, 250);
  }, [onClose]);

  /** Return to the filter form without resetting field values. */
  const handleNewSearch = useCallback(() => {
    setPhase("form");
    setResult(null);
    setError(null);
    setSearch("");
  }, []);

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

  /** Navigate to a different page of results. */
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
        setError(err instanceof Error ? err.message : "Failed to fetch page");
      } finally {
        setPageLoading(false);
      }
    },
    [form, result]
  );

  /** Generic form field setter. */
  const setField = <K extends keyof ReportParams>(key: K, value: ReportParams[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Client-side search filter: matches name or barcode case-insensitively. */
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

  /** DataTable column definitions for report results. */
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
        render: (doc) => <span className="text-nowrap fs-12">{formatDate(doc.upload_date)}</span>,
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
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" className="drm-outer">
      {/* ── Flush gradient header ─────────────────────────────── */}
      <div className="drm-header">
        <div className="d-flex align-items-center gap-3">
          <div className="drm-header__icon">
            <Icon name="bar-chart-2" />
          </div>
          <div>
            <h5 className="mb-0 fw-semibold text-white lh-1">
              Fetch Uploaded Documents
            </h5>
            <p className="mb-0 drm-header__subtitle">
              Generate a custom report with optional filters
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-close btn-close-white flex-shrink-0"
          onClick={handleClose}
          aria-label="Close"
        />
      </div>

      {/* ── Scrollable body ───────────────────────────────────── */}
      <div className="drm-body">

        {/* ── Phase: form ── */}
        {(phase === "form" || phase === "loading") && (
          <div className="drm-section">
            <div className="alert alert-info d-flex align-items-start gap-2 py-2 mb-4">
              <Icon name="info" className="flex-shrink-0 mt-1" />
              <span className="fs-13">
                All fields are <strong>optional</strong>. Submitting without filters fetches{" "}
                <strong>all documents up to today</strong>. When both an ID and name are given,
                the ID takes priority.
              </span>
            </div>

            <div className="row g-3">
              {/* Date Range */}
              <div className="col-12">
                <p className="drm-section-label">Date Range</p>
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
                <p className="drm-section-label">Company / Brand</p>
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
                <p className="drm-section-label">Department</p>
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
                        setField("department_id", e.target.value ? Number(e.target.value) : undefined)
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
                <p className="drm-section-label">Document Type</p>
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
                <p className="drm-section-label">Uploader</p>
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
                        setField("uploader_id", e.target.value ? Number(e.target.value) : undefined)
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
                <p className="drm-section-label">Folder</p>
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
                <p className="drm-section-label">Additional Filters</p>
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

            {phase === "loading" && (
              <div className="d-flex align-items-center gap-2 mt-4 text-muted fs-13">
                <Spinner size="sm" />
                Fetching documents report…
              </div>
            )}
          </div>
        )}

        {/* ── Phase: results ── */}
        {phase === "results" && result && (
          <div className="drm-section">
            {/* Summary stats strip */}
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

            {/* Inline search — same SearchInput as documents list / report page */}
            <div className="mb-3">
              <SearchInput
                value={search}
                onImmediateChange={setSearch}
                debounceMs={0}
                onDebouncedChange={noopDebouncedSearch}
                placeholder={t("documents.report.searchPlaceholder")}
                icon="file-search-corner"
                highlight
                clearable
                clearAriaLabel={t("documents.report.clearSearchAria")}
                className="documents__search-wrap documents__search-wrap--report"
                stackClassName={
                  search.trim() ? "documents__search-stack--report" : ""
                }
                inputClassName="documents__search-input"
                aria-label={t("documents.report.searchPlaceholder")}
                footer={
                  search.trim() ? (
                    <p className="text-muted fs-12 mt-1 mb-0">
                      {t("documents.report.showingCount", {
                        shown: displayedData.length,
                        total: result.data.length,
                      })}
                    </p>
                  ) : undefined
                }
              />
            </div>

            {pageLoading && (
              <div className="d-flex align-items-center gap-2 mb-2 text-muted fs-13">
                <Spinner size="sm" />
                Loading page…
              </div>
            )}

            {error && (
              <div className="alert alert-danger mb-3 fs-13 py-2">{error}</div>
            )}

            {/* Results table */}
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
        )}
      </div>

      {/* ── Fixed footer ─────────────────────────────────────── */}
      <div className="drm-footer">
        {/* Pagination group: left side in LTR, right side in RTL */}
        <div className={`d-flex gap-2 ${isRtl ? "order-2" : "order-1"}`}>
          {phase === "results" && hasPagination && (
            <>
              <Button
                variant="outline"
                size="md"
                className="btn-outline-secondary d-inline-flex align-items-center"
                disabled={!canPrev}
                onClick={() => void handlePageChange(result!.pagination.page - 1)}
              >
                <Icon name="chevron-left" className="me-1" />
                Prev
              </Button>
              <span className="d-flex align-items-center fs-13 text-muted px-1">
                {result!.pagination.page} / {result!.pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="md"
                className="btn-outline-secondary d-inline-flex align-items-center"
                disabled={!canNext}
                onClick={() => void handlePageChange(result!.pagination.page + 1)}
              >
                Next
                <Icon name="chevron-right" className="ms-1" />
              </Button>
            </>
          )}
        </div>

        {/* Action group: right side in LTR, left side in RTL */}
        <div className={`d-flex gap-2 ${isRtl ? "order-1" : "order-2"}`}>
          {phase === "form" && (
            <>
              <Button
                variant="outline"
                size="md"
                className="btn-outline-secondary"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={false}
                disabled={false}
                onClick={() => void handleSubmit()}
              >
                Submit
              </Button>
            </>
          )}
          {phase === "loading" && (
            <Button
              variant="outline"
              size="md"
              className="btn-outline-secondary"
              disabled
            >
              Cancel
            </Button>
          )}
          {phase === "results" && (
            <>
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
                className="btn-outline-secondary"
                onClick={handleClose}
              >
                Close
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
