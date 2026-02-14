import type { RefObject } from "react";
import type { TFunction } from "i18next";
import { Button, Icon } from "../../../../shared/components/ui";

export interface UploadDocumentFileSectionProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  selectedFile: File | undefined;
  selectedFiles: File[];
  onFileChange: (files: File[]) => void;
  onClear: () => void;
  errorMessage?: string;
  uploadKind: "main" | "sub" | "attachment";
  uploadWhatDocumentLabel: string;
  t: TFunction;
  setValue: (name: "file", value: File | undefined, opts?: { shouldValidate?: boolean }) => void;
}

/** File input section: label, hidden input, select/clear buttons, and validation error. */
export function UploadDocumentFileSection({
  fileInputRef,
  selectedFile,
  selectedFiles,
  onFileChange,
  onClear,
  errorMessage,
  uploadKind,
  uploadWhatDocumentLabel,
  t,
  setValue,
}: UploadDocumentFileSectionProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    onFileChange(files);
    const file = files[0];
    if (file) {
      setValue("file", file, { shouldValidate: true });
    } else {
      setValue("file", undefined, { shouldValidate: true });
    }
  };

  return (
    <div className="mb-3">
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
        multiple={uploadKind === "attachment" || uploadKind === "sub"}
        onChange={handleInputChange}
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
