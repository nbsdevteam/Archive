import type { TFunction } from "i18next";
import { Button } from "@/shared/components/ui";

export interface UploadDocumentActionsProps {
  onClose: () => void;
  onUpload: () => void;
  isUploading: boolean;
  submitDisabled: boolean;
  t: TFunction;
}

/** Footer actions: Cancel and Upload buttons for the upload side panel. */
export function UploadDocumentActions({
  onClose,
  onUpload,
  isUploading,
  submitDisabled,
  t,
}: UploadDocumentActionsProps) {
  return (
    <div className="d-flex gap-2 justify-content-end">
      <Button variant="secondary" onClick={onClose} disabled={isUploading}>
        {t("common.cancel", { defaultValue: "Cancel" })}
      </Button>
      <Button variant="secondary" isLoading={isUploading} onClick={onUpload} disabled={submitDisabled} data-testid="upload-document-submit">
        {t("documents.uploadDocument", { defaultValue: "Upload document" })}
      </Button>
    </div>
  );
}
