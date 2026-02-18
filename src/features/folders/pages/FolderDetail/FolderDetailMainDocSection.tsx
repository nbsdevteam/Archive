import type { TFunction } from "i18next";
import type { Document } from "@/app/adapter/api/documents.api";
import { Button, Icon } from "@/shared/components/ui";

export interface FolderDetailMainDocSectionProps {
  t: TFunction;
  mainDoc: Document | null;
  formatDate: (date?: string | null) => string;
  onDownload: () => void;
  onNavigate: (documentId: number) => void;
  onEdit?: (documentId: number) => void;
  onArchive: (documentId: number) => void;
  onUnarchive: (documentId: number) => void;
  isArchiving: boolean;
  isUnarchiving: boolean;
}

/** Main document card: single row table with barcode, name, type, date, status, actions. */
export function FolderDetailMainDocSection({
  t,
  mainDoc,
  formatDate,
  onDownload,
  onNavigate,
  onEdit,
  onArchive,
  onUnarchive,
  isArchiving,
  isUnarchiving,
}: FolderDetailMainDocSectionProps) {
  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();
  const handleMainDocRowClick = () => mainDoc && onNavigate(mainDoc.id);
  const handleDownloadClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDownload();
  };
  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (mainDoc && onEdit) onEdit(mainDoc.id);
  };
  const handleUnarchiveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (mainDoc) onUnarchive(mainDoc.id);
  };
  const handleArchiveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (mainDoc) onArchive(mainDoc.id);
  };
  const handleViewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (mainDoc) onNavigate(mainDoc.id);
  };

  return (
    <div className="card mb-3">
      <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h6 className="mb-0">📌 {t("folders.mainDocument", { defaultValue: "Main document" })}</h6>
        {mainDoc && (
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={onDownload}>
            <Icon name="download" className="me-1" />
            {t("documents.download", { defaultValue: "Download" })}
          </Button>
        )}
      </div>
      <div className="card-body">
        {!mainDoc ? (
          <p className="text-muted mb-0">{t("common.noData", { defaultValue: "No data" })}</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>{t("documents.barcode", { defaultValue: "Barcode" })}</th>
                  <th>{t("documents.name", { defaultValue: "Name" })}</th>
                  <th>{t("documents.type", { defaultValue: "Type" })}</th>
                  <th>{t("documents.uploadDate", { defaultValue: "Upload date" })}</th>
                  <th>{t("folders.updated", { defaultValue: "Updated" })}</th>
                  <th>{t("documents.status", { defaultValue: "Status" })}</th>
                  <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ cursor: "pointer" }} onClick={handleMainDocRowClick}>
                  <td>{mainDoc.barcode ?? "–"}</td>
                  <td>{mainDoc.title ?? mainDoc.name ?? "–"}</td>
                  <td>{mainDoc.document_type_name ?? (mainDoc.document_type as { name?: string })?.name ?? "–"}</td>
                  <td>{formatDate(mainDoc.upload_date)}</td>
                  <td>{formatDate(mainDoc.last_modified ?? mainDoc.upload_date)}</td>
                  <td>{mainDoc.status ?? "–"}</td>
                  <td className="text-end">
                    <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={handleDownloadClick}>
                      <Icon name="download" className="me-1" />
                      {t("documents.download", { defaultValue: "Download" })}
                    </Button>
                    {onEdit && (
                      <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={handleEditClick}>
                        <Icon name="pencil" className="me-1" />
                        {t("common.edit", { defaultValue: "Edit" })}
                      </Button>
                    )}
                    {(mainDoc.status ?? "").toLowerCase() === "archived" ? (
                      <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={handleUnarchiveClick} disabled={isUnarchiving}>
                        {t("documents.unarchive", { defaultValue: "Unarchive" })}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={handleArchiveClick} disabled={isArchiving}>
                        {t("documents.archive", { defaultValue: "Archive" })}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleViewClick}>
                      {t("common.view", { defaultValue: "View" })}
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
