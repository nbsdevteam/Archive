import { useState, useCallback } from "react";
import { Modal, Button, Icon, Spinner } from "@/shared/components/ui";
import { ModalFooter } from "@/shared/components/ui";
import { getDocumentsReport } from "@/app/adapter/api/documents";
import type { ReportParams, ReportResult, ReportDocument } from "@/app/adapter/api/documents/report";

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

/** Formats an ISO date string to a human-readable "DD MMM YYYY" form. */
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

/** Bootstrap badge for document confidentiality level. */
function ConfidentialityBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    public: "bg-success-subtle text-success",
    internal: "bg-primary-subtle text-primary",
    confidential: "bg-warning-subtle text-warning",
    strict: "bg-danger-subtle text-danger",
  };
  const cls = map[level?.toLowerCase()] ?? "bg-secondary-subtle text-secondary";
  return (
    <span className={`badge ${cls} text-capitalize`}>{level || "—"}</span>
  );
}

/** Bootstrap badge for document state. */
function StateBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    active: "bg-success-subtle text-success",
    archived: "bg-secondary-subtle text-secondary",
    trashed: "bg-danger-subtle text-danger",
  };
  const cls = map[state?.toLowerCase()] ?? "bg-secondary-subtle text-secondary";
  return (
    <span className={`badge ${cls} text-capitalize`}>{state || "—"}</span>
  );
}

/** Bootstrap badge for OCR processing status. */
function OcrBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-success-subtle text-success",
    pending: "bg-warning-subtle text-warning",
    failed: "bg-danger-subtle text-danger",
    processing: "bg-info-subtle text-info",
  };
  const cls = map[status?.toLowerCase()] ?? "bg-secondary-subtle text-secondary";
  return (
    <span className={`badge ${cls} text-capitalize`}>{status || "—"}</span>
  );
}

/** Results table for the fetched report data. */
function ResultsTable({ data }: { data: ReportDocument[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <Icon name="file-search-corner" className="mb-2 opacity-40" style={{ width: 40, height: 40 }} />
        <p className="mb-0">No documents matched your filters.</p>
      </div>
    );
  }

  return (
    <div className="documents-report-modal__table-wrap">
      <table className="table table-sm table-hover documents-report-modal__table mb-0">
        <thead className="table-light">
          <tr>
            <th className="text-nowrap">ID</th>
            <th className="text-nowrap">Name</th>
            <th className="text-nowrap">Barcode</th>
            <th className="text-nowrap">Upload Date</th>
            <th className="text-nowrap">Uploader</th>
            <th className="text-nowrap">Department</th>
            <th className="text-nowrap">Doc Type</th>
            <th className="text-nowrap">Company</th>
            <th className="text-nowrap">Folder</th>
            <th className="text-nowrap">Confidentiality</th>
            <th className="text-nowrap">State</th>
            <th className="text-nowrap text-center">Ver.</th>
            <th className="text-nowrap">OCR</th>
          </tr>
        </thead>
        <tbody>
          {data.map((doc) => (
            <tr key={doc.id}>
              <td className="text-muted fs-12">{doc.id}</td>
              <td className="fw-medium">{doc.name}</td>
              <td>
                <code className="fs-12">{doc.barcode}</code>
              </td>
              <td className="text-nowrap fs-12">{formatDate(doc.upload_date)}</td>
              <td className="text-nowrap">{doc.uploader_name}</td>
              <td className="text-nowrap">{doc.department_name}</td>
              <td className="text-nowrap">{doc.document_type_name}</td>
              <td className="text-nowrap">{doc.company_name || <span className="text-muted">—</span>}</td>
              <td className="text-nowrap">{doc.folder_name || <span className="text-muted">—</span>}</td>
              <td>
                <ConfidentialityBadge level={doc.confidentiality_level} />
              </td>
              <td>
                <StateBadge state={doc.state} />
              </td>
              <td className="text-center">{doc.version_count}</td>
              <td>
                <OcrBadge status={doc.ocr_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * DocumentsReportModal – two-phase modal:
 * 1. Filter form: all fields optional, fetches all docs up to today on Proceed.
 * 2. Results view: summary stats + scrollable table + pagination.
 */
export function DocumentsReportModal({ isOpen, onClose }: DocumentsReportModalProps) {
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<ReportParams>(DEFAULT_FORM);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

  /** Reset local state and close. */
  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setPhase("form");
      setResult(null);
      setError(null);
      setForm(DEFAULT_FORM);
    }, 250);
  }, [onClose]);

  /** Go back to the filter form to run a new search. */
  const handleNewSearch = useCallback(() => {
    setPhase("form");
    setResult(null);
    setError(null);
  }, []);

  /** Fetch the report with the current form values. */
  const handleProceed = useCallback(async () => {
    setPhase("loading");
    setError(null);
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

  /** Fetch a specific page while staying in results view. */
  const handlePageChange = useCallback(
    async (newPage: number) => {
      if (!result) return;
      setPageLoading(true);
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

  /** Generic field setter for the filter form. */
  const setField = <K extends keyof ReportParams>(key: K, value: ReportParams[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      {/* ── Colored header ── */}
      <div className="documents-report-modal__header">
        <div className="d-flex align-items-center gap-3">
          <div className="documents-report-modal__header-icon">
            <Icon name="bar-chart-2" />
          </div>
          <div>
            <h5 className="mb-0 fw-semibold text-white">Fetch Uploaded Documents</h5>
            <p className="mb-0 fs-13 documents-report-modal__header-subtitle">
              Generate a custom report with optional filters
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={handleClose}
          aria-label="Close"
        />
      </div>

      {/* ── Phase: form ── */}
      {phase === "form" && (
        <>
          <div className="alert alert-info d-flex align-items-start gap-2 mb-4 py-2 mt-2">
            <Icon name="info" className="flex-shrink-0 mt-1" style={{ width: "1em", height: "1em" }} />
            <span className="fs-13">
              All fields below are <strong>optional</strong>. Clicking <strong>Proceed</strong> without
              filling any field will fetch <strong>all documents up to today</strong>. When both an ID and a
              name are provided for the same filter, the ID takes priority.
            </span>
          </div>

          <div className="row g-3">
            {/* Date Range */}
            <div className="col-12">
              <p className="documents-report-modal__section-label">Date Range</p>
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
              <p className="documents-report-modal__section-label">Company / Brand</p>
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
              <p className="documents-report-modal__section-label">Department</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">Department ID</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="e.g. 4"
                    value={form.department_id ?? ""}
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
                    onChange={(e) => setField("department_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Document Type */}
            <div className="col-12">
              <p className="documents-report-modal__section-label">Document Type</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">Document Type ID</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="e.g. 5"
                    value={form.document_type_id ?? ""}
                    onChange={(e) =>
                      setField("document_type_id", e.target.value ? Number(e.target.value) : undefined)
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
              <p className="documents-report-modal__section-label">Uploader</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">Uploader ID</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="e.g. 2"
                    value={form.uploader_id ?? ""}
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
                    onChange={(e) => setField("uploader_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Folder */}
            <div className="col-12">
              <p className="documents-report-modal__section-label">Folder</p>
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

            {/* Confidentiality + State + Per Page */}
            <div className="col-12">
              <p className="documents-report-modal__section-label">Additional Filters</p>
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
                  <label className="form-label fs-13">Results per page</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={1}
                    max={500}
                    value={form.per_page ?? 50}
                    onChange={(e) =>
                      setField("per_page", Math.min(500, Math.max(1, Number(e.target.value) || 50)))
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

          <ModalFooter>
            <Button
              variant="outline"
              size="md"
              className="btn-outline-secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={() => void handleProceed()}>
              <Icon name="search" className="me-2" />
              Proceed
            </Button>
          </ModalFooter>
        </>
      )}

      {/* ── Phase: loading ── */}
      {phase === "loading" && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-3">
          <Spinner size="lg" />
          <p className="text-muted mb-0 fs-14">Fetching documents report…</p>
        </div>
      )}

      {/* ── Phase: results ── */}
      {phase === "results" && result && (
        <>
          {/* Summary stats strip */}
          <div className="documents-report-modal__summary">
            <div className="documents-report-modal__stat">
              <span className="documents-report-modal__stat-value">
                {result.summary.total.toLocaleString()}
              </span>
              <span className="documents-report-modal__stat-label">Total Documents</span>
            </div>
            <div className="documents-report-modal__stat">
              <span className="documents-report-modal__stat-value">
                {result.pagination.total_pages}
              </span>
              <span className="documents-report-modal__stat-label">Pages</span>
            </div>
            <div className="documents-report-modal__stat">
              <span className="documents-report-modal__stat-value">
                {formatDate(result.summary.from_date)}
              </span>
              <span className="documents-report-modal__stat-label">From</span>
            </div>
            <div className="documents-report-modal__stat">
              <span className="documents-report-modal__stat-value">
                {formatDate(result.summary.to_date)}
              </span>
              <span className="documents-report-modal__stat-label">To</span>
            </div>
            {Object.keys(result.summary.filters ?? {}).length > 0 && (
              <div className="documents-report-modal__stat">
                <span className="documents-report-modal__stat-value">
                  {Object.keys(result.summary.filters).length}
                </span>
                <span className="documents-report-modal__stat-label">Active Filters</span>
              </div>
            )}
          </div>

          {/* Page-level loading overlay */}
          {pageLoading && (
            <div className="d-flex align-items-center gap-2 my-2 text-muted fs-13">
              <Spinner size="sm" />
              Loading page…
            </div>
          )}

          {error && (
            <div className="alert alert-danger mb-2 fs-13 py-2">{error}</div>
          )}

          <ResultsTable data={result.data} />

          {/* Pagination controls */}
          {result.pagination.total_pages > 1 && (
            <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
              <span className="text-muted fs-13">
                Page <strong>{result.pagination.page}</strong> of{" "}
                <strong>{result.pagination.total_pages}</strong> &middot;{" "}
                {result.pagination.total.toLocaleString()} total
              </span>
              <div className="d-flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  className="btn-outline-secondary d-inline-flex align-items-center"
                  disabled={result.pagination.page <= 1 || pageLoading}
                  onClick={() => void handlePageChange(result.pagination.page - 1)}
                >
                  <Icon name="chevron-left" className="me-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="btn-outline-secondary d-inline-flex align-items-center"
                  disabled={result.pagination.page >= result.pagination.total_pages || pageLoading}
                  onClick={() => void handlePageChange(result.pagination.page + 1)}
                >
                  Next
                  <Icon name="chevron-right" className="ms-1" />
                </Button>
              </div>
            </div>
          )}

          <ModalFooter>
            <Button
              variant="outline"
              size="md"
              className="btn-outline-secondary d-inline-flex align-items-center"
              onClick={handleNewSearch}
            >
              <Icon name="arrow-left" className="me-1" />
              New Search
            </Button>
            <Button variant="outline" size="md" className="btn-outline-secondary" onClick={handleClose}>
              Close
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
