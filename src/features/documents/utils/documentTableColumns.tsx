import type { TFunction } from "i18next";
import { convertToArabianStandardTime, formatRelativeTime } from "../../../shared/utils/format/date";
import type { ColumnDef } from "../../../shared/components/ui/DataTable/DataTable.types";
import type { Document } from "../../../app/adapter/api/documents.api";
import { getDocumentStatusBadgeVariant } from "./getDocumentStatusBadgeVariant";

/** Badge variant helper type for status column */
export type DocumentStatusBadgeVariantFn = (status?: string) => string;

export interface DocumentColumnsOptions {
  /** i18n translate function */
  t: TFunction;
  /** Optional override for status badge variant (defaults to getDocumentStatusBadgeVariant) */
  getDocumentStatusBadgeVariant?: DocumentStatusBadgeVariantFn;
}

/**
 * Returns shared DataTable column definitions for main documents list and archived list.
 * Single source of truth for: name, barcode, type, department, upload date, status.
 */
export function getDocumentTableColumns(
  options: DocumentColumnsOptions
): ColumnDef<Document>[] {
  const { t, getDocumentStatusBadgeVariant: getBadge = getDocumentStatusBadgeVariant } = options;
  return [
    {
      id: "name",
      header: t("documents.name", { defaultValue: "Name" }),
      render: (row: Document) => row.name || row.title || "-",
    },
    {
      id: "barcode",
      header: t("documents.barcode", { defaultValue: "Barcode" }),
      render: (row: Document) => <span className="Num">{row.barcode || "-"}</span>,
    },
    {
      id: "type",
      header: t("documents.type", { defaultValue: "Type" }),
      render: (row: Document) =>
        row.document_type_name || row.document_type?.name || "-",
    },
    {
      id: "department",
      header: t("documents.department", { defaultValue: "Department" }),
      render: (row: Document) =>
        row.department_name || row.department?.name || "-",
    },
    {
      id: "company",
      header: t("documents.companyBrand", { defaultValue: "Company/Brand" }),
      render: (row: Document) => row.company_name ?? "-",
    },
    {
      id: "uploadDate",
      header: t("documents.uploadDate", { defaultValue: "Upload Date" }),
      render: (row: Document) =>
        row.upload_date
          ? formatRelativeTime(new Date(row.upload_date))
          : "-",
    },
    {
      id: "status",
      header: t("documents.status", { defaultValue: "Status" }),
      render: (row: Document) => (
        <span className={`badge bg-${getBadge(row.status)}`}>
          {row.status || "unknown"}
        </span>
      ),
    },
  ];
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
      header: t("documents.name", { defaultValue: "Document name" }),
      render: (row: TrashDocument) => row.name || row.title || "-",
    },
    {
      id: "barcode",
      header: t("documents.barcode", { defaultValue: "Barcode" }),
      render: (row: TrashDocument) => (
        <span className="Num">{row.barcode || "-"}</span>
      ),
    },
    {
      id: "type",
      header: t("documents.type", { defaultValue: "Type" }),
      render: (row: TrashDocument) =>
        row.document_type_name || row.document_type?.name || "-",
    },
    {
      id: "department",
      header: t("documents.department", { defaultValue: "Department" }),
      render: (row: TrashDocument) =>
        row.department_name || row.department?.name || "-",
    },
    {
      id: "deletedAt",
      header: t("documents.deletedAt", { defaultValue: "Deleted at" }),
      render: (row: TrashDocument) =>
        row.deleted_at ? convertToArabianStandardTime(row.deleted_at) : "–",
    },
    {
      id: "restoreDeadline",
      header: t("documents.restoreDeadline", { defaultValue: "Restore deadline" }),
      render: (row: TrashDocument) =>
        row.restore_deadline ? convertToArabianStandardTime(row.restore_deadline) : "–",
    },
  ];
}
