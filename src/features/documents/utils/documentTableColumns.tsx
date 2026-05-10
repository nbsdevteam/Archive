import type { TFunction } from "i18next";
import type { ColumnDef } from "../../../shared/components/ui/DataTable/DataTable.types";
import type { Document } from "../../../app/adapter/api/documents.api";
import { Icon } from "@/shared/components/ui/Icon";
import { getDocumentStatusBadgeVariant } from "./getDocumentStatusBadgeVariant";
import { formatDocumentDateDisplay } from "@/shared/utils/documents/documentDate";

/** Badge variant helper type for status column */
export type DocumentStatusBadgeVariantFn = (status?: string) => string;

/** Optional sort UI: when provided, column headers show an arrow control for sorting. */
export interface DocumentTableSortOptions {
  onSortClick: (columnId: string) => void;
  getSortIconForColumn: (columnId: string) => { type: "asc" | "desc"; groupLabel?: string } | null;
}

export interface DocumentColumnsOptions {
  /** i18n translate function */
  t: TFunction;
  /** Optional override for status badge variant (defaults to getDocumentStatusBadgeVariant) */
  getDocumentStatusBadgeVariant?: DocumentStatusBadgeVariantFn;
  /** When set, sortable columns render header label + arrow button; arrow click triggers onSortClick. */
  sort?: DocumentTableSortOptions;
}

const SORTABLE_COLUMN_IDS = ["name", "barcode", "fileSize", "type", "department", "company", "uploadDate", "documentDate", "status"] as const;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Renders a sortable column header: label plus a stacked up/down arrow pair button.
 * Both arrows are always visible; the active sort direction is fully opaque,
 * the inactive direction is dimmed. This prevents either arrow from ever disappearing.
 */
function SortableHeader({
  label,
  columnId,
  sort,
  t,
}: {
  label: string;
  columnId: string;
  sort: DocumentTableSortOptions;
  t: TFunction;
}) {
  const iconState = sort.getSortIconForColumn(columnId);

  const isAsc  = iconState?.type === "asc";
  const isDesc = iconState?.type === "desc";

  /** CSS modifier: one arrow highlighted (same for directional and group columns). */
  const sortModifier = isAsc ? "sort-dir--asc" : isDesc ? "sort-dir--desc" : "";

  const ariaLabel =
    iconState?.groupLabel
      ? t("documents.groupByLabel", {
          defaultValue: "Group by {{label}} (show {{value}} first)",
          label,
          value: iconState.groupLabel,
        })
      : isAsc
        ? t("documents.sortAsc", { defaultValue: "Sort by {{label}} (ascending)", label })
        : isDesc
          ? t("documents.sortDesc", { defaultValue: "Sort by {{label}} (descending)", label })
          : t("documents.sortByLabel", { defaultValue: "Sort by {{label}}", label });

  return (
    <span className="d-inline-flex align-items-center gap-1 documents-table-sort-header">
      <span>{label}</span>
      <button
        type="button"
        className={`btn btn-link btn-sm p-0 border-0 documents-table-sort-btn text-body-secondary${sortModifier ? ` ${sortModifier}` : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          sort.onSortClick(columnId);
        }}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        {/* Stacked pair: both arrows always rendered; CSS drives active/inactive opacity */}
        <span className="documents-sort-arrow-pair" aria-hidden="true">
          <Icon name="chevron-up"   className="sort-arrow-up"   style={{ width: "0.7rem", height: "0.7rem", display: "block" }} />
          <Icon name="chevron-down" className="sort-arrow-down" style={{ width: "0.7rem", height: "0.7rem", display: "block" }} />
        </span>
      </button>
    </span>
  );
}

/**
 * Returns shared DataTable column definitions for main documents list and archived list.
 * Single source of truth for: name, barcode, type, department, upload date, status.
 * When options.sort is provided, sortable columns show a header with an arrow control.
 */
export function getDocumentTableColumns(
  options: DocumentColumnsOptions
): ColumnDef<Document>[] {
  const { t, getDocumentStatusBadgeVariant: getBadge = getDocumentStatusBadgeVariant, sort } = options;
  const baseColumns: ColumnDef<Document>[] = [
    {
      id: "name",
      truncate: true,
      header: sort && SORTABLE_COLUMN_IDS.includes("name") ? (
        <SortableHeader
          label={t("documents.name", { defaultValue: "Name" })}
          columnId="name"
          sort={sort}
          t={t}
        />
      ) : (
        t("documents.name", { defaultValue: "Name" })
      ),
      render: (row: Document) => row.name || row.title || "-",
    },
    {
      id: "barcode",
      truncate: true,
      header: sort && SORTABLE_COLUMN_IDS.includes("barcode") ? (
        <SortableHeader
          label={t("documents.barcode", { defaultValue: "Barcode" })}
          columnId="barcode"
          sort={sort}
          t={t}
        />
      ) : (
        t("documents.barcode", { defaultValue: "Barcode" })
      ),
      render: (row: Document) => <span className="Num">{row.barcode || "-"}</span>,
    },
    {
      id: "fileSize",
      truncate: true,
      header: sort && SORTABLE_COLUMN_IDS.includes("fileSize") ? (
        <SortableHeader
          label={t("documents.fileSize", { defaultValue: "File Size" })}
          columnId="fileSize"
          sort={sort}
          t={t}
        />
      ) : (
        t("documents.fileSize", { defaultValue: "File Size" })
      ),
      render: (row: Document) => (
        <span className="Num text-muted small">
          {row.file_size != null && row.file_size > 0 ? formatFileSize(row.file_size) : "-"}
        </span>
      ),
    },
    {
      id: "type",
      truncate: true,
      header: sort && SORTABLE_COLUMN_IDS.includes("type") ? (
        <SortableHeader
          label={t("documents.type", { defaultValue: "Type" })}
          columnId="type"
          sort={sort}
          t={t}
        />
      ) : (
        t("documents.type", { defaultValue: "Type" })
      ),
      render: (row: Document) =>
        row.document_type_name || row.document_type?.name || "-",
    },
    {
      id: "department",
      truncate: true,
      header: sort && SORTABLE_COLUMN_IDS.includes("department") ? (
        <SortableHeader
          label={t("documents.department", { defaultValue: "Department" })}
          columnId="department"
          sort={sort}
          t={t}
        />
      ) : (
        t("documents.department", { defaultValue: "Department" })
      ),
      render: (row: Document) =>
        row.department_name || row.department?.name || "-",
    },
    {
      id: "company",
      truncate: true,
      header: sort && SORTABLE_COLUMN_IDS.includes("company") ? (
        <SortableHeader
          label={t("documents.companyBrand", { defaultValue: "Company/Brand" })}
          columnId="company"
          sort={sort}
          t={t}
        />
      ) : (
        t("documents.companyBrand", { defaultValue: "Company/Brand" })
      ),
      render: (row: Document) => row.company_name ?? "-",
    },
    {
      id: "uploadDate",
      truncate: true,
      header: sort && SORTABLE_COLUMN_IDS.includes("uploadDate") ? (
        <SortableHeader
          label={t("documents.uploadDate", { defaultValue: "Upload Date" })}
          columnId="uploadDate"
          sort={sort}
          t={t}
        />
      ) : (
        t("documents.uploadDate", { defaultValue: "Upload Date" })
      ),
      render: (row: Document) => row.upload_date || "-",
    },
    {
      id: "documentDate",
      truncate: true,
      header: sort && SORTABLE_COLUMN_IDS.includes("documentDate") ? (
        <SortableHeader
          label={t("documents.documentDate", { defaultValue: "Document date" })}
          columnId="documentDate"
          sort={sort}
          t={t}
        />
      ) : (
        t("documents.documentDate", { defaultValue: "Document date" })
      ),
      render: (row: Document) => (
        <span className="Num text-muted small">{formatDocumentDateDisplay(row.document_date)}</span>
      ),
    },
    {
      id: "status",
      header: sort && SORTABLE_COLUMN_IDS.includes("status") ? (
        <SortableHeader
          label={t("documents.status", { defaultValue: "Status" })}
          columnId="status"
          sort={sort}
          t={t}
        />
      ) : (
        t("documents.status", { defaultValue: "Status" })
      ),
      render: (row: Document) => (
        <span className={`badge bg-${getBadge(row.status)}`}>
          {row.status || "unknown"}
        </span>
      ),
    },
  ];
  return baseColumns;
}

/** Trash list row type: document with deleted_at and restore_deadline */
export interface TrashDocument extends Document {
  deleted_at?: string;
  restore_deadline?: string;
}

export interface TrashColumnsOptions {
  t: TFunction;
}

/**
 * Returns DataTable column definitions for the trash documents list.
 * Columns: name, barcode, type, department, deleted at, restore deadline.
 */
export function getDocumentTableColumnsForTrash(
  options: TrashColumnsOptions
): ColumnDef<TrashDocument>[] {
  const { t } = options;
  return [
    {
      id: "name",
      truncate: true,
      header: t("documents.name", { defaultValue: "Document name" }),
      render: (row: TrashDocument) => row.name || row.title || "-",
    },
    {
      id: "barcode",
      truncate: true,
      header: t("documents.barcode", { defaultValue: "Barcode" }),
      render: (row: TrashDocument) => (
        <span className="Num">{row.barcode || "-"}</span>
      ),
    },
    {
      id: "fileSize",
      truncate: true,
      header: t("documents.fileSize", { defaultValue: "File Size" }),
      render: (row: TrashDocument) => (
        <span className="Num text-muted small">
          {row.file_size != null && row.file_size > 0 ? formatFileSize(row.file_size) : "-"}
        </span>
      ),
    },
    {
      id: "type",
      truncate: true,
      header: t("documents.type", { defaultValue: "Type" }),
      render: (row: TrashDocument) =>
        row.document_type_name || row.document_type?.name || "-",
    },
    {
      id: "department",
      truncate: true,
      header: t("documents.department", { defaultValue: "Department" }),
      render: (row: TrashDocument) =>
        row.department_name || row.department?.name || "-",
    },
    {
      id: "deletedAt",
      truncate: true,
      header: t("documents.deletedAt", { defaultValue: "Deleted at" }),
      render: (row: TrashDocument) => row.deleted_at ?? "–",
    },
    {
      id: "restoreDeadline",
      truncate: true,
      header: t("documents.restoreDeadline", { defaultValue: "Restore deadline" }),
      render: (row: TrashDocument) => row.restore_deadline ?? "–",
    },
  ];
}
