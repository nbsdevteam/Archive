import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { PageLayout } from "@/shared/layout/PageLayout";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { PaginationSection } from "@/shared/components/PaginationSection";
import { Button, Icon, Spinner, DataTable, SearchInput } from "@/shared/components/ui";
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

/** Formats an ISO datetime string for the current locale (e.g. DD MMM YYYY). */
function formatReportDate(iso: string | undefined | null, locale: string): string {
  if (!iso) return "—";
  try {
    const loc = locale.startsWith("ar") ? "ar-SA" : "en-GB";
    return new Date(iso).toLocaleDateString(loc, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Coloured badge for document confidentiality level (label uses i18n when key matches API). */
function ConfidentialityBadge({ level }: { level: string }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    public: "bg-success-subtle text-success",
    internal: "bg-primary-subtle text-primary",
    confidential: "bg-warning-subtle text-warning",
    strict: "bg-danger-subtle text-danger",
  };
  const key = level?.toLowerCase();
  const cls = map[key] ?? "bg-secondary-subtle text-secondary";
  const known = key && ["public", "internal", "confidential", "strict"].includes(key);
  const label = known ? t(`documents.confidentiality.${key}`) : level || "—";
  return <span className={`badge ${cls} text-capitalize`}>{label}</span>;
}

/** Coloured badge for document state. */
function StateBadge({ state }: { state: string }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    active: "bg-success-subtle text-success",
    archived: "bg-secondary-subtle text-secondary",
    trashed: "bg-danger-subtle text-danger",
  };
  const key = state?.toLowerCase();
  const cls = map[key] ?? "bg-secondary-subtle text-secondary";
  const labelKeys: Record<string, string> = {
    active: "documents.report.stateActive",
    archived: "documents.report.stateArchived",
    trashed: "documents.report.stateTrashed",
  };
  const label =
    key && labelKeys[key] ? t(labelKeys[key]) : state || "—";
  return <span className={`badge ${cls} text-capitalize`}>{label}</span>;
}

/** Coloured badge for OCR processing status. */
function OcrBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const map: Record<string, string> = {
    completed: "bg-success-subtle text-success",
    pending: "bg-warning-subtle text-warning",
    failed: "bg-danger-subtle text-danger",
    processing: "bg-info-subtle text-info",
  };
  const key = status?.toLowerCase();
  const cls = map[key] ?? "bg-secondary-subtle text-secondary";
  const labelKeys: Record<string, string> = {
    completed: "documents.report.ocrCompleted",
    pending: "documents.report.ocrPending",
    failed: "documents.report.ocrFailed",
    processing: "documents.report.ocrProcessing",
  };
  const label =
    key && labelKeys[key] ? t(labelKeys[key]) : status || "—";
  return <span className={`badge ${cls} text-capitalize`}>{label}</span>;
}

/** Compact badge for folder document role (main / sub / attachment / other). */
function DocumentRoleBadge({ role }: { role: string }) {
  const { t } = useTranslation();
  const r = (role || "").toLowerCase();
  const map: Record<string, string> = {
    main: "bg-primary-subtle text-primary",
    sub: "bg-secondary-subtle text-secondary",
    attachment: "bg-info-subtle text-info",
    other: "bg-light text-dark border",
  };
  const cls = map[r] ?? "bg-secondary-subtle text-secondary";
  const labelKeys: Record<string, string> = {
    main: "documents.report.roleMain",
    sub: "documents.report.roleSub",
    attachment: "documents.report.roleAttachment",
    other: "documents.report.roleOther",
  };
  const label = r && labelKeys[r] ? t(labelKeys[r]) : role || "—";
  return <span className={`badge ${cls} text-capitalize`}>{label}</span>;
}

/**
 * Role column: badge, optional parent id, optional attachment flag.
 */
function DocumentRoleCell({ doc }: { doc: ReportDocument }) {
  const { t } = useTranslation();
  const role = doc.document_role;
  const parentLine =
    doc.parent_document_id != null
      ? t("documents.report.parentDocument", { id: doc.parent_document_id })
      : null;
  const attachmentLine =
    doc.is_attachment === true ? (
      <div className="d-flex align-items-center gap-1 text-muted fs-11 mt-1">
        <Icon name="paperclip" style={{ width: "0.75em", height: "0.75em" }} />
        <span>{t("documents.report.flaggedAttachment")}</span>
      </div>
    ) : null;

  if (!role || !String(role).trim()) {
    return (
      <div className="drp-role-cell">
        <span className="text-muted">—</span>
        {parentLine != null && <div className="text-muted fs-11 mt-1">{parentLine}</div>}
        {attachmentLine}
      </div>
    );
  }
  return (
    <div className="drp-role-cell">
      <DocumentRoleBadge role={String(role)} />
      {parentLine != null && <div className="text-muted fs-11 mt-1">{parentLine}</div>}
      {attachmentLine}
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
  const { t, i18n } = useTranslation();

  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<ReportParams>(DEFAULT_FORM);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [search, setSearch] = useState("");

  /** Select options for confidentiality (reuses global confidentiality labels). */
  const confidentialityOptions = useMemo(
    () => [
      { value: "", label: t("documents.report.filterAny") },
      { value: "public", label: t("documents.confidentiality.public") },
      { value: "internal", label: t("documents.confidentiality.internal") },
      { value: "confidential", label: t("documents.confidentiality.confidential") },
      { value: "strict", label: t("documents.confidentiality.strict") },
    ],
    [t]
  );

  /** Document lifecycle state filter values. */
  const stateOptions = useMemo(
    () => [
      { value: "active", label: t("documents.report.stateActive") },
      { value: "archived", label: t("documents.report.stateArchived") },
      { value: "all", label: t("documents.report.stateAll") },
    ],
    [t]
  );

  /** Folder document_role filter values (matches API). */
  const documentRoleOptions = useMemo(
    () =>
      [
        { value: "", label: t("documents.report.filterAny") },
        { value: "main", label: t("documents.report.roleMain") },
        { value: "sub", label: t("documents.report.roleSub") },
        { value: "attachment", label: t("documents.report.roleAttachment") },
        { value: "other", label: t("documents.report.roleOther") },
      ] as const,
    [t]
  );

  /** No-op debounced handler when search is driven only by `onImmediateChange` (client-side filter). */
  const noopDebouncedSearch = useCallback((_value: string) => {}, []);

  /** Copies row text to the clipboard and shows a translated toast. */
  const copyTextToClipboard = useCallback(
    (text: string) => {
      void navigator.clipboard
        .writeText(text)
        .then(() =>
          toast.success(t("documents.report.toastCopied"), { autoClose: 2000 })
        )
        .catch(() => toast.error(t("documents.report.toastCopyFailed")));
    },
    [t]
  );

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
      setError(
        err instanceof Error ? err.message : t("documents.report.fetchFailed")
      );
      setPhase("form");
    }
  }, [form, t]);

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
        setError(
          err instanceof Error ? err.message : t("documents.report.loadPageFailed")
        );
      } finally {
        setPageLoading(false);
      }
    },
    [form, result, t]
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
        setError(
          err instanceof Error
            ? err.message
            : t("documents.report.changePageSizeFailed")
        );
      } finally {
        setPageLoading(false);
      }
    },
    [form, result, t]
  );

  /** Export all documents to Excel without pagination. */
  const handleExportToExcel = useCallback(async () => {
    if (!result) return;
    setExportLoading(true);
    try {
      // Fetch ALL documents without pagination (per_page = large number or all)
      const exportPayload = buildPayload({
        ...form,
        page: 1,
        per_page: result.summary.total > 0 ? result.summary.total : 10000,
      });
      const allData = await getDocumentsReport(exportPayload);

      // Map documents to Excel rows with translated headers
      const excelData = allData.data.map((doc) => ({
        [t("documents.report.colName")]: doc.name || "",
        [t("documents.report.colBarcode")]: doc.barcode || "",
        [t("documents.report.colUploadDate")]: formatReportDate(doc.upload_date, i18n.language),
        [t("documents.report.colUploader")]: doc.uploader_name || "",
        [t("documents.report.colDepartment")]: doc.department_name || "",
        [t("documents.report.colDocType")]: doc.document_type_name || "",
        [t("documents.report.colCompany")]: doc.company_name || "",
        [t("documents.report.colFolder")]: doc.folder_name || "",
        [t("documents.report.colRole")]: doc.document_role || "",
        [t("documents.report.colConfidentiality")]: doc.confidentiality_level || "",
        [t("documents.report.colState")]: doc.state || "",
        [t("documents.report.colVer")]: doc.version_count?.toString() || "0",
        [t("documents.report.colOcr")]: doc.ocr_status || "",
        [t("documents.report.parentDocument").replace(" #{{id}}", "")]: doc.parent_document_id?.toString() || "",
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, t("documents.report.pageTitle"));

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(excelData[0] || {}).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...excelData.map((row) => String(row[key] || "").length)
        );
        return { wch: Math.min(maxLen + 2, maxWidth) };
      });
      worksheet["!cols"] = colWidths;

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const filename = `documents-report-${dateStr}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);
      toast.success(t("documents.report.exportSuccess"), { autoClose: 3000 });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("documents.report.exportFailed");
      toast.error(msg);
    } finally {
      setExportLoading(false);
    }
  }, [result, form, t, i18n.language]);

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
        header: t("documents.report.colName"),
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
              title={t("documents.report.copyNameTitle")}
              onClick={(e) => {
                e.stopPropagation();
                copyTextToClipboard(doc.name);
              }}
            >
              <Icon name="copy" />
            </button>
          </div>
        ),
      },
      {
        id: "document_role",
        header: t("documents.report.colRole"),
        width: "8.5rem",
        headerClassName: "align-top",
        className: "align-top",
        render: (doc) => <DocumentRoleCell doc={doc} />,
      },
      {
        id: "barcode",
        header: t("documents.report.colBarcode"),
        width: "8rem",
        truncate: true,
        render: (doc) => <code className="fs-12">{doc.barcode}</code>,
      },
      {
        id: "upload_date",
        header: t("documents.report.colUploadDate"),
        width: "7.5rem",
        truncate: true,
        render: (doc) => formatReportDate(doc.upload_date, i18n.language),
      },
      {
        id: "uploader_name",
        header: t("documents.report.colUploader"),
        width: "9rem",
        truncate: true,
        render: (doc) => doc.uploader_name,
      },
      {
        id: "department_name",
        header: t("documents.report.colDepartment"),
        width: "9rem",
        truncate: true,
        render: (doc) => doc.department_name,
      },
      {
        id: "document_type_name",
        header: t("documents.report.colDocType"),
        width: "8rem",
        truncate: true,
        render: (doc) => doc.document_type_name,
      },
      {
        id: "company_name",
        header: t("documents.report.colCompany"),
        width: "8rem",
        truncate: true,
        render: (doc) => doc.company_name || "—",
      },
      {
        id: "folder_name",
        header: t("documents.report.colFolder"),
        width: "9rem",
        truncate: true,
        render: (doc) => doc.folder_name || "—",
      },
      {
        id: "confidentiality_level",
        header: t("documents.report.colConfidentiality"),
        width: "7.5rem",
        truncate: true,
        render: (doc) => <ConfidentialityBadge level={doc.confidentiality_level} />,
      },
      {
        id: "state",
        header: t("documents.report.colState"),
        width: "5.5rem",
        truncate: true,
        render: (doc) => <StateBadge state={doc.state} />,
      },
      {
        id: "version_count",
        header: t("documents.report.colVer"),
        width: "3rem",
        headerClassName: "text-center",
        className: "text-center",
        truncate: true,
        render: (doc) => String(doc.version_count),
      },
      {
        id: "ocr_status",
        header: t("documents.report.colOcr"),
        width: "6rem",
        truncate: true,
        render: (doc) => <OcrBadge status={doc.ocr_status} />,
      },
    ],
    [t, i18n.language, copyTextToClipboard]
  );

  return (
    <PageLayout
      title={t("documents.report.pageTitle")}
      breadcrumbItems={[
        { label: t("documents.title"), to: all_routes.documents },
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
              <h5 className="mb-0 fw-semibold text-white lh-1">
                {t("documents.report.filtersTitle")}
              </h5>
              <p className="mb-0 drp-card-header__subtitle">
                {t("documents.report.filtersSubtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {/* Info banner */}
          <div className="alert alert-info d-flex align-items-start gap-2 py-2 mb-4">
            <Icon name="info" className="flex-shrink-0 mt-1" />
            <span className="fs-13">{t("documents.report.idNamePriorityHint")}</span>
          </div>

          <div className="row g-3">
            {/* Date Range */}
            <div className="col-12">
              <p className="drp-section-label">{t("documents.report.sectionDateRange")}</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">{t("documents.report.fromDate")}</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={form.from_date ?? ""}
                    onChange={(e) => setField("from_date", e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13">{t("documents.report.toDate")}</label>
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
              <p className="drp-section-label">{t("documents.report.sectionCompanyBrand")}</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">{t("documents.report.companyId")}</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder={t("documents.report.placeholderCompanyId")}
                    value={form.company_id ?? ""}
                    onChange={(e) =>
                      setField("company_id", e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13">{t("documents.report.companyName")}</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={t("documents.report.placeholderCompanyName")}
                    value={form.company_name ?? ""}
                    onChange={(e) => setField("company_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Department */}
            <div className="col-12">
              <p className="drp-section-label">{t("documents.report.sectionDepartment")}</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">{t("documents.report.departmentId")}</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder={t("documents.report.placeholderDepartmentId")}
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
                  <label className="form-label fs-13">{t("documents.report.departmentName")}</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={t("documents.report.placeholderDepartmentName")}
                    value={form.department_name ?? ""}
                    onChange={(e) => setField("department_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Document Type */}
            <div className="col-12">
              <p className="drp-section-label">{t("documents.report.sectionDocumentType")}</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">{t("documents.report.documentTypeId")}</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder={t("documents.report.placeholderDocumentTypeId")}
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
                  <label className="form-label fs-13">{t("documents.report.documentTypeName")}</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={t("documents.report.placeholderDocumentTypeName")}
                    value={form.document_type ?? ""}
                    onChange={(e) => setField("document_type", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Uploader */}
            <div className="col-12">
              <p className="drp-section-label">{t("documents.report.sectionUploader")}</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">{t("documents.report.uploaderId")}</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder={t("documents.report.placeholderUploaderId")}
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
                  <label className="form-label fs-13">{t("documents.report.uploaderName")}</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={t("documents.report.placeholderUploaderName")}
                    value={form.uploader_name ?? ""}
                    onChange={(e) => setField("uploader_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Folder */}
            <div className="col-12">
              <p className="drp-section-label">{t("documents.report.sectionFolder")}</p>
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label fs-13">{t("documents.report.folderId")}</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder={t("documents.report.placeholderFolderId")}
                    value={form.folder_id ?? ""}
                    onChange={(e) =>
                      setField("folder_id", e.target.value ? Number(e.target.value) : undefined)
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13">{t("documents.report.folderName")}</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={t("documents.report.placeholderFolderName")}
                    value={form.folder_name ?? ""}
                    onChange={(e) => setField("folder_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Additional filters */}
            <div className="col-12">
              <p className="drp-section-label">{t("documents.report.sectionAdditionalFilters")}</p>
              <div className="row g-2">
                <div className="col-md-4">
                  <label className="form-label fs-13">{t("documents.report.confidentialityLevel")}</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.confidentiality_level ?? ""}
                    onChange={(e) => setField("confidentiality_level", e.target.value)}
                  >
                    {confidentialityOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fs-13">{t("documents.report.state")}</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.state ?? "active"}
                    onChange={(e) => setField("state", e.target.value)}
                  >
                    {stateOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fs-13">{t("documents.report.documentRole")}</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.document_role ?? ""}
                    onChange={(e) => setField("document_role", e.target.value)}
                  >
                    {documentRoleOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-muted fs-11 mb-0 mt-1">
                    {t("documents.report.documentRoleHelp")}
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
            {t("documents.report.backToDocuments")}
          </Button>
          <Button variant="primary" size="md" onClick={() => void handleSubmit()}>
            {t("common.submit")}
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
                <h5 className="mb-0 fw-semibold text-white lh-1">
                  {t("documents.report.loadingTitle")}
                </h5>
                <p className="mb-0 drp-card-header__subtitle">
                  {t("documents.report.loadingSubtitle")}
                </p>
              </div>
            </div>
          </div>
          <div className="card-body d-flex flex-column align-items-center justify-content-center py-5 gap-3">
            <Spinner size="lg" />
            <p className="text-muted mb-0 fs-14">{t("documents.report.loadingBody")}</p>
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
                <strong>{t("documents.report.totalDocuments")}:</strong>{" "}
                {result.summary.total.toLocaleString(i18n.language)}
              </span>
              <span className="drm-summary__item">
                <strong>{t("documents.report.pages")}:</strong> {result.pagination.total_pages}
              </span>
              <span className="drm-summary__item">
                <strong>{t("documents.report.summaryFrom")}:</strong>{" "}
                {formatReportDate(result.summary.from_date, i18n.language)}
              </span>
              <span className="drm-summary__item">
                <strong>{t("documents.report.summaryTo")}:</strong>{" "}
                {formatReportDate(result.summary.to_date, i18n.language)}
              </span>
              {Object.keys(result.summary.filters ?? {}).length > 0 && (
                <span className="drm-summary__item">
                  <strong>{t("documents.report.activeFilters")}:</strong>{" "}
                  {Object.keys(result.summary.filters).length}
                </span>
              )}
            </div>

            {/* Toolbar: search matches documents list width (~320px); export at inline-end. */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 w-100">
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
              <Button
                variant="outline"
                size="md"
                className="d-inline-flex align-items-center btn-outline-theme flex-shrink-0"
                onClick={() => void handleExportToExcel()}
                disabled={exportLoading || pageLoading || !result.data.length}
                title={t("documents.report.exportToExcel")}
                aria-label={t("documents.report.exportToExcel")}
              >
                {exportLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {t("documents.report.exportingToExcel")}
                  </>
                ) : (
                  <>
                    <Icon name="download" className="me-2" />
                    {t("documents.report.exportToExcel")}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Table body — match Documents list card body (min height + full-width scroll) */}
          <div className="card-body h-min-50vh p-0">
            {pageLoading && (
              <div className="d-flex align-items-center gap-2 px-3 py-2 text-muted fs-13 border-bottom">
                <Spinner size="sm" />
                {t("documents.report.loadingPage")}
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
                emptyMessage={t("documents.report.emptyMessage")}
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
              {t("documents.report.newSearch")}
            </Button>
            <Button
              variant="outline"
              size="md"
              className="btn-outline-secondary d-inline-flex align-items-center"
              onClick={() => navigate(all_routes.documents)}
            >
              <Icon name="arrow-left" className="me-1" />
              {t("documents.report.backToDocuments")}
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default DocumentsReportPage;
