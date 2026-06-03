import type { TFunction } from "i18next";
import type { Document } from "@/app/adapter/api/documents.api";
import { formatDocumentDateDisplay } from "@/shared/utils/documents/documentDate";

function formatFolderCellValue(
  name: string | null | undefined,
  id: number | null | undefined,
  idLabel: string,
): string | null {
  const hasId = id != null && id !== undefined;
  const hasName = Boolean(name && String(name).trim());
  if (hasName && hasId) return `${name} (${idLabel}: ${id})`;
  if (hasName) return String(name);
  if (hasId) return `${idLabel}: ${id}`;
  return null;
}

export interface DocumentDetailInfoCardProps {
  t: TFunction;
  doc: Document;
  title: string;
  documentTypeName: string;
  departmentName: string;
  uploaderName: string;
  isArchived: boolean;
  formatDate: (date?: string | null) => string;
  tags: Array<{ id?: number; name?: string }>;
}

/**
 * Document detail header card: title, barcode, status, and two-column metadata tables.
 */
export function DocumentDetailInfoCard({
  t,
  doc,
  title,
  documentTypeName,
  departmentName,
  uploaderName,
  isArchived,
  formatDate,
  tags,
}: DocumentDetailInfoCardProps) {
  const folderIdLabel = t("documents.folderIdShort", { defaultValue: "ID" });
  /** Single row labeled "Parent folder": prefer API parent fields; else folder (avoids duplicate Folder + Parent rows). */
  const parentFolderDisplay =
    formatFolderCellValue(
      doc.parent_folder_name ?? undefined,
      doc.parent_folder_id ?? undefined,
      folderIdLabel,
    ) ??
    formatFolderCellValue(
      doc.folder_name ?? undefined,
      doc.folder_id ?? undefined,
      folderIdLabel,
    );
  const isMainDocumentLabel =
    doc.is_main_document === true
      ? t("common.yes", { defaultValue: "Yes" })
      : doc.is_main_document === false
        ? t("common.no", { defaultValue: "No" })
        : "–";

  return (
    <div className="card mb-3 document-detail__info-card">
      <div className="card-header d-flex flex-wrap align-items-center gap-2">
        <h5 className="card-title mb-0">{title}</h5>
        {doc.barcode && (
          <span className="badge bg-secondary">{doc.barcode}</span>
        )}
        <span
          className={`badge ${
            isArchived ? "bg-warning" : "bg-success"
          }`}
        >
          {doc.status ?? "–"}
        </span>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <table className="table table-sm table-borderless">
              <tbody>
                <tr>
                  <td className="text-muted">{t("documents.barcode", { defaultValue: "Barcode" })}</td>
                  <td>{doc.barcode ?? "–"}</td>
                </tr>
                <tr>
                  <td className="text-muted">{t("documents.type", { defaultValue: "Type" })}</td>
                  <td>{documentTypeName}</td>
                </tr>
                <tr>
                  <td className="text-muted">{t("documents.department", { defaultValue: "Department" })}</td>
                  <td>{departmentName}</td>
                </tr>
                <tr>
                  <td className="text-muted">{t("documents.uploader", { defaultValue: "Uploader" })}</td>
                  <td>{uploaderName}</td>
                </tr>
                <tr>
                  <td className="text-muted">{t("documents.uploadDate", { defaultValue: "Upload date" })}</td>
                  <td>{formatDate(doc.upload_date)}</td>
                </tr>
                <tr>
                  <td className="text-muted">{t("documents.uploadVersion", { defaultValue: "Upload version" })}</td>
                  <td>{doc.document_upload_version || "—"}</td>
                </tr>
                <tr>
                  <td className="text-muted">{t("documents.documentDate", { defaultValue: "Document date" })}</td>
                  <td>{formatDocumentDateDisplay(doc.document_date)}</td>
                </tr>
                <tr>
                  <td className="text-muted">{t("documents.lastModified", { defaultValue: "Last modified" })}</td>
                  <td>{formatDate(doc.last_modified)}</td>
                </tr>
                <tr>
                  <td className="text-muted">
                    {t("documents.isMainDocument", { defaultValue: "Is main document" })}
                  </td>
                  <td>{isMainDocumentLabel}</td>
                </tr>
                {parentFolderDisplay != null && (
                  <tr>
                    <td className="text-muted">
                      {t("documents.parentFolder", { defaultValue: "Parent folder" })}
                    </td>
                    <td>{parentFolderDisplay}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="col-md-6">
            <table className="table table-sm table-borderless">
              <tbody>
                <tr>
                  <td className="text-muted">{t("documents.status", { defaultValue: "Status" })}</td>
                  <td>{doc.status ?? "–"}</td>
                </tr>
                <tr>
                  <td className="text-muted">{t("documents.confidentialityLabel", { defaultValue: "Confidentiality" })}</td>
                  <td>{doc.confidentiality_level ?? "–"}</td>
                </tr>
                {doc.po_number && (
                  <tr>
                    <td className="text-muted">{t("documents.poNumber", { defaultValue: "PO Number" })}</td>
                    <td>{doc.po_number}</td>
                  </tr>
                )}
                {doc.bl_number && (
                  <tr>
                    <td className="text-muted">{t("documents.blNumber", { defaultValue: "BL Number" })}</td>
                    <td>{doc.bl_number}</td>
                  </tr>
                )}
                {doc.container_number && (
                  <tr>
                    <td className="text-muted">{t("documents.containerNumber", { defaultValue: "Container Number" })}</td>
                    <td>{doc.container_number}</td>
                  </tr>
                )}
                {doc.invoice_number && (
                  <tr>
                    <td className="text-muted">{t("documents.invoiceNumber", { defaultValue: "Invoice Number" })}</td>
                    <td>{doc.invoice_number}</td>
                  </tr>
                )}
                {doc.envoy_number && (
                  <tr>
                    <td className="text-muted">{t("documents.envoyNumber", { defaultValue: "Envoy Number" })}</td>
                    <td>{doc.envoy_number}</td>
                  </tr>
                )}
                {tags.length > 0 && (
                  <tr>
                    <td className="text-muted">{t("documents.tags", { defaultValue: "Tags" })}</td>
                    <td>
                      {tags.map((tag: { id?: number; name?: string }) => (
                        <span key={tag.id ?? tag.name} className="badge bg-light text-dark me-1">
                          {tag.name ?? "–"}
                        </span>
                      ))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
