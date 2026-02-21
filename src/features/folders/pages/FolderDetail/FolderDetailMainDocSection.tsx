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

/** Main document card: responsive key/value layout and action buttons. No table for better mobile UX. */
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
  const handleCardClick = () => mainDoc && onNavigate(mainDoc.id);
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
        <h4 className="mb-0">📌 {t("folders.mainDocument", { defaultValue: "Main document" })}</h4>
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
          <div
            className="folder-detail-maindoc-kv"
            style={{ cursor: "pointer" }}
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick();
              }
            }}
            aria-label={t("folders.mainDocument", { defaultValue: "Main document" })}
          >
            <div className="folder-detail-maindoc-kv-row">
              <span className="folder-detail-maindoc-kv-label">{t("documents.barcode", { defaultValue: "Barcode" })}</span>
              <span className="folder-detail-maindoc-kv-value">{mainDoc.barcode ?? "–"}</span>
            </div>
            <div className="folder-detail-maindoc-kv-row">
              <span className="folder-detail-maindoc-kv-label">{t("documents.name", { defaultValue: "Name" })}</span>
              <span className="folder-detail-maindoc-kv-value">{mainDoc.title ?? mainDoc.name ?? "–"}</span>
            </div>
            <div className="folder-detail-maindoc-kv-row">
              <span className="folder-detail-maindoc-kv-label">{t("documents.type", { defaultValue: "Type" })}</span>
              <span className="folder-detail-maindoc-kv-value">{mainDoc.document_type_name ?? (mainDoc.document_type as { name?: string })?.name ?? "–"}</span>
            </div>
            <div className="folder-detail-maindoc-kv-row">
              <span className="folder-detail-maindoc-kv-label">{t("documents.uploadDate", { defaultValue: "Upload date" })}</span>
              <span className="folder-detail-maindoc-kv-value">{formatDate(mainDoc.upload_date)}</span>
            </div>
            <div className="folder-detail-maindoc-kv-row">
              <span className="folder-detail-maindoc-kv-label">{t("documents.status", { defaultValue: "Status" })}</span>
              <span className="folder-detail-maindoc-kv-value">{mainDoc.status ?? "–"}</span>
            </div>
            <div className="folder-detail-maindoc-kv-row">
              <span className="folder-detail-maindoc-kv-label">{t("common.actions", { defaultValue: "Actions" })}</span>
              <div className="folder-detail-maindoc-kv-value folder-detail-maindoc-actions" onClick={stopPropagation}>
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleDownloadClick}>
                <Icon name="download" className="me-1" />
                {t("documents.download", { defaultValue: "Download" })}
              </Button>
              {onEdit && (
                <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleEditClick}>
                  <Icon name="pencil" className="me-1" />
                  {t("common.edit", { defaultValue: "Edit" })}
                </Button>
              )}
              {(mainDoc.status ?? "").toLowerCase() === "archived" ? (
                <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleUnarchiveClick} disabled={isUnarchiving}>
                  {t("documents.unarchive", { defaultValue: "Unarchive" })}
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleArchiveClick} disabled={isArchiving}>
                  {t("documents.archive", { defaultValue: "Archive" })}
                </Button>
              )}
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleViewClick}>
                {t("common.view", { defaultValue: "View" })}
              </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
