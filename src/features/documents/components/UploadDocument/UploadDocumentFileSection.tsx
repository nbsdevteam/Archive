import type { RefObject } from "react";
import type { TFunction } from "i18next";
import { Button, Icon } from "@/shared/components/ui";
import { getBaseName } from "@/shared/utils/files/filename";

export interface UploadDocumentFileSectionProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  selectedFile: File | undefined;
  selectedFiles: File[];
  onFileChange: (files: File[]) => void;
  onClear: () => void;
  errorMessage?: string;
  uploadKind: "main" | "sub" | "attachment";
  /** When true (main only), multiple files can be selected and one folder per file is auto-created from filename. */
  uploadMultipleMain?: boolean;
  onUploadMultipleMainChange?: (value: boolean) => void;
  /** When true (sub only), multiple files can be selected; each file becomes one sub document in the selected folder. */
  uploadMultipleSub?: boolean;
  onUploadMultipleSubChange?: (value: boolean) => void;
  /** Called when a single main file is selected so parent can prefill title and folder name from filename. */
  onMainSingleFileSelected?: (baseName: string) => void;
  uploadWhatDocumentLabel: string;
  t: TFunction;
  setValue: (name: "file", value: File | undefined, opts?: { shouldValidate?: boolean }) => void;
}

/** File input section: label, optional "upload multiple" toggle (main), hidden input, select/clear buttons, and validation error. */
export function UploadDocumentFileSection({
  fileInputRef,
  selectedFile,
  selectedFiles,
  onFileChange,
  onClear,
  errorMessage,
  uploadKind,
  uploadMultipleMain = false,
  onUploadMultipleMainChange,
  uploadMultipleSub = false,
  onUploadMultipleSubChange,
  onMainSingleFileSelected,
  uploadWhatDocumentLabel,
  t,
  setValue,
}: UploadDocumentFileSectionProps) {
  const allowMultiple = uploadKind === "attachment" || (uploadKind === "main" && uploadMultipleMain) || (uploadKind === "sub" && uploadMultipleSub);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    onFileChange(files);
    const file = files[0];
    if (file) {
      setValue("file", file, { shouldValidate: true });
      if (uploadKind === "main" && !uploadMultipleMain && files.length === 1 && onMainSingleFileSelected) {
        onMainSingleFileSelected(getBaseName(file.name));
      }
    } else {
      setValue("file", undefined, { shouldValidate: true });
    }
  };

  return (
    <div className="mb-3">
      {uploadKind === "main" && onUploadMultipleMainChange != null && (
        <div className="mb-2 py-2 px-3 rounded bg-light">
          <label className="form-check d-flex align-items-center gap-2 mb-0">
            <input
              type="checkbox"
              className="form-check-input"
              checked={uploadMultipleMain}
              onChange={(e) => onUploadMultipleMainChange(e.target.checked)}
              data-testid="upload-multiple-main-checkbox"
            />
            <span>{t("documents.uploadMultipleFiles", { defaultValue: "Upload multiple files" })}</span>
          </label>
          {uploadMultipleMain && (
            <p className="small text-muted mb-0 mt-2">
              {t("documents.batchMainUploadInfo", {
                defaultValue: "Automatic folders will be created using the name of each file. Each document title will be the file name.",
              })}
            </p>
          )}
        </div>
      )}
      {uploadKind === "sub" && onUploadMultipleSubChange != null && (
        <div className="mb-2 py-2 px-3 rounded bg-light">
          <label className="form-check d-flex align-items-center gap-2 mb-0">
            <input
              type="checkbox"
              className="form-check-input"
              checked={uploadMultipleSub}
              onChange={(e) => onUploadMultipleSubChange(e.target.checked)}
              data-testid="upload-multiple-sub-checkbox"
            />
            <span>{t("documents.uploadMultipleFiles", { defaultValue: "Upload multiple files" })}</span>
          </label>
          {uploadMultipleSub && (
            <p className="small text-muted mb-0 mt-2">
              {t("documents.batchSubUploadInfo", {
                defaultValue: "Multiple sub documents will be added to the selected folder. Each file becomes one document with the file name as title.",
              })}
            </p>
          )}
        </div>
      )}
      <label className="form-label">
        {uploadWhatDocumentLabel}
        <span className="text-danger ms-1">*</span>
      </label>
      <input
        type="file"
        className="d-none"
        id="upload-doc-file"
        accept="*/*"
        ref={fileInputRef}
        multiple={allowMultiple}
        onChange={handleInputChange}
        data-testid="upload-file-input"
      />
      <div className="d-flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className={`flex-grow-1 ${errorMessage ? "is-invalid" : ""}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="paperclip" className="me-1" />
          {selectedFile instanceof File
            ? selectedFiles.length > 1
              ? `Selected: ${selectedFiles.length} files`
              : `Selected: ${selectedFile.name}`
            : t("documents.selectFile", { defaultValue: "Select File" })}
        </Button>
        {(selectedFile instanceof File || selectedFiles.length > 0) && (
          <Button type="button" variant="outline" className="btn-outline-secondary" onClick={onClear}>
            <Icon name="x" className="me-1" />
            {t("common.remove", { defaultValue: "Remove" })}
          </Button>
        )}
      </div>
      {errorMessage && <div className="invalid-feedback d-block">{errorMessage}</div>}
    </div>
  );
}
