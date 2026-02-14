import type { TFunction } from "i18next";
import { Button, Icon } from "@/shared/components/ui";
import { FilePreview } from "@/shared/components/FilePreview";
import type { DocumentDetail } from "@/app/adapter/api/documents.api";

export interface FolderDetailPreviewSectionProps {
  t: TFunction;
  previewDoc: DocumentDetail | null;
  previewFileName: string;
  onDownload: () => void;
}

/** Preview card: FilePreview for selected document when available. */
export function FolderDetailPreviewSection({
  t,
  previewDoc,
  previewFileName,
  onDownload,
}: FolderDetailPreviewSectionProps) {
  const hasPreview = previewDoc?.id && previewFileName;
  
  // Extract the latest version ID from version history to validate cache freshness
  // Versions array is sorted newest first, so versions[0] is the most recent upload
  const latestVersionId = previewDoc?.versions?.length 
    ? previewDoc.versions[0]?.id 
    : undefined;

  // Debug logging to help troubleshoot cache invalidation
  console.log('[FolderDetailPreviewSection] Preview state:', {
    documentId: previewDoc?.id,
    fileName: previewFileName,
    versionsCount: previewDoc?.versions?.length ?? 0,
    latestVersionId,
    allVersions: previewDoc?.versions?.map(v => ({ id: v.id, version: v.version_number })),
  });

  return (
    <div className="card mb-3">
      <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h6 className="mb-0">📄 {t("documents.preview", { defaultValue: "Preview" })}</h6>
        {hasPreview && (
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={onDownload}>
            <Icon name="download" className="me-1" />
            {t("documents.download", { defaultValue: "Download" })}
          </Button>
        )}
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-12 col-lg-6">
            {hasPreview ? (
              <FilePreview
                documentId={previewDoc!.id!}
                fileName={previewFileName}
                maxHeight="500px"
                latestVersionId={latestVersionId}
                notPreviewableMessage={t("documents.previewNotAvailable", {
                  defaultValue: "Preview not available for this file type",
                })}
              />
            ) : (
              <p className="text-muted mb-0">{t("common.noData", { defaultValue: "No data" })}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
