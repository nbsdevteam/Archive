import type { TFunction } from "i18next";
import type { FolderDetail } from "../../types/folders.types";

export interface FolderDetailInfoCardProps {
  t: TFunction;
  folder: FolderDetail;
  folderId: number;
  documentCount: number;
  /** Display string for "Updated" date (already in Arabia Standard Time from API). */
  formatUpdated: (date: string | null | undefined) => string;
}

/**
 * Folder detail header card: name, document count, code, department, type, status, updated, description.
 */
export function FolderDetailInfoCard({
  t,
  folder,
  folderId,
  documentCount,
  formatUpdated,
}: FolderDetailInfoCardProps) {
  return (
    <div className="card mb-3">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h3 className="card-title mb-0">{folder.name || `Folder #${folderId}`}</h3>
        <span className="text-muted small">
          {documentCount}{" "}
          {documentCount === 1
            ? t("documents.document", { defaultValue: "document" })
            : t("documents.documents", { defaultValue: "documents" })}
        </span>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="text-muted small">{t("folders.code", { defaultValue: "Code" })}</div>
            <div className="fw-medium">{folder.code ?? "–"}</div>
          </div>
          <div className="col-md-4">
            <div className="text-muted small">{t("folders.departmentName", { defaultValue: "Department" })}</div>
            <div className="fw-medium">{folder.department_name ?? "–"}</div>
          </div>
          <div className="col-md-4">
            <div className="text-muted small">{t("folders.type", { defaultValue: "Type" })}</div>
            <div className="fw-medium">{folder.folder_type ?? "–"}</div>
          </div>
          <div className="col-md-4">
            <div className="text-muted small">{t("folders.status", { defaultValue: "Status" })}</div>
            <div className="fw-medium">{folder.state ?? "–"}</div>
          </div>
          <div className="col-md-4">
            <div className="text-muted small">{t("folders.updated", { defaultValue: "Updated" })}</div>
            <div className="fw-medium">
              {formatUpdated(
                folder.last_modified ?? folder.updated_at ?? folder.write_date ?? folder.create_date ?? folder.updated
              ) || "–"}
            </div>
          </div>
          <div className="col-12">
            <div className="text-muted small">{t("folders.description", { defaultValue: "Description" })}</div>
            <div className="fw-medium">{folder.description ?? "–"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
