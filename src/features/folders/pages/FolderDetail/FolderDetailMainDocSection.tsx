import type { TFunction } from "i18next";
import type { Document } from "@/app/adapter/api/documents.api";
import { Button, Icon } from "@/shared/components/ui";

export interface FolderDetailMainDocSectionProps {
  t: TFunction;
  mainDoc: Document | null;
  formatDate: (date?: string | null) => string;
  onDownload: () => void;
  onNavigate: (documentId: number) => void;
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
  onArchive,
  onUnarchive,
  isArchiving,
  isUnarchiving,
}: FolderDetailMainDocSectionProps) {
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
                  <th>{t("documents.status", { defaultValue: "Status" })}</th>
                  <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  style={{ cursor: "pointer" }}
                  onClick={() => onNavigate(mainDoc.id)}
                >
                  <td>{mainDoc.barcode ?? "–"}</td>
                  <td>{mainDoc.title ?? mainDoc.name ?? "–"}</td>
                  <td>{mainDoc.document_type_name ?? (mainDoc.document_type as { name?: string })?.name ?? "–"}</td>
                  <td>{formatDate(mainDoc.upload_date)}</td>
                  <td>{mainDoc.status ?? "–"}</td>
                  <td className="text-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-outline-secondary me-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload();
                      }}
                    >
                      <Icon name="download" className="me-1" />
                      {t("documents.download", { defaultValue: "Download" })}
                    </Button>
                    {(mainDoc.status ?? "").toLowerCase() === "archived" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="btn-outline-secondary me-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnarchive(mainDoc.id);
                        }}
                        disabled={isUnarchiving}
                      >
                        {t("documents.unarchive", { defaultValue: "Unarchive" })}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="btn-outline-secondary me-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(mainDoc.id);
                        }}
                        disabled={isArchiving}
                      >
                        {t("documents.archive", { defaultValue: "Archive" })}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="btn-outline-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(mainDoc.id);
                      }}
                    >
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
