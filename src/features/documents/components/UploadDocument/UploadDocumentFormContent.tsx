import type { RefObject } from "react";
import type { TFunction } from "i18next";
import type { Control, UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { UploadFormValues } from "./types";
import type { SelectOption } from "@/shared/components/ui";
import type { Department } from "@/app/adapter/api/admin.api";
import type { DocumentType } from "@/app/adapter/api/admin.api";
import type { Folder } from "@/features/folders/types/folders.types";
import type { BulkUploadProgressData } from "@/app/adapter/api/documents.api";
import { Button } from "@/shared/components/ui";
import { UploadDocumentTargetSection } from "./UploadDocumentTargetSection";
import { UploadDocumentOptionalSection } from "./UploadDocumentOptionalSection";

export interface UploadDocumentFormContentProps {
  submitError: string | null;
  control: Control<UploadFormValues>;
  register: UseFormRegister<UploadFormValues>;
  errors: FieldErrors<UploadFormValues>;
  setValue: UseFormSetValue<UploadFormValues>;
  uploadKind: "main" | "sub" | "attachment";
  departmentId: number;
  documentTypeId: number;
  title: string;
  folderName: string;
  folderCode: string;
  folderId: number | undefined;
  targetDocumentId: number | undefined;
  lockFolderContext: boolean;
  initialValues?: Partial<UploadFormValues>;
  departments: Department[];
  documentTypes: DocumentType[];
  folders: Folder[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  selectedFile: File | undefined;
  selectedFiles: File[];
  onFileChange: (files: File[]) => void;
  onClearFile: () => void;
  uploadWhatDocumentLabel: string;
  uploadMultipleMain?: boolean;
  onUploadMultipleMainChange?: (value: boolean) => void;
  onMainSingleFileSelected?: (baseName: string) => void;
  tagOptions: SelectOption[];
  bulkJobId: string | null;
  bulkProgress: BulkUploadProgressData | null;
  isCancellingBulkJob: boolean;
  onCancelBulkJob: () => void;
  isUploading: boolean;
  t: TFunction;
  fillFolderNameFromTitle: (titleValue: string) => void;
}

/** Form body: error alert, target section, file section, bulk progress, optional section. */
export function UploadDocumentFormContent({
  submitError,
  control,
  register,
  errors,
  setValue,
  uploadKind,
  departmentId,
  documentTypeId,
  title,
  folderName,
  folderCode,
  folderId,
  targetDocumentId,
  lockFolderContext,
  initialValues,
  departments,
  documentTypes,
  folders,
  fileInputRef,
  selectedFile,
  selectedFiles,
  onFileChange,
  onClearFile,
  uploadWhatDocumentLabel,
  uploadMultipleMain,
  onUploadMultipleMainChange,
  onMainSingleFileSelected,
  tagOptions,
  bulkJobId,
  bulkProgress,
  isCancellingBulkJob,
  onCancelBulkJob,
  isUploading,
  t,
  fillFolderNameFromTitle,
}: UploadDocumentFormContentProps) {
  return (
    <>
      {submitError && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {submitError}
        </div>
      )}

      <UploadDocumentTargetSection
        control={control}
        register={register}
        errors={errors}
        setValue={setValue}
        uploadKind={uploadKind}
        departmentId={departmentId}
        documentTypeId={documentTypeId}
        title={title}
        folderName={folderName}
        folderCode={folderCode}
        folderId={folderId}
        targetDocumentId={targetDocumentId}
        lockFolderContext={lockFolderContext}
        initialValues={initialValues}
        departments={departments}
        documentTypes={documentTypes}
        folders={folders}
        t={t}
        fillFolderNameFromTitle={fillFolderNameFromTitle}
        fileInputRef={fileInputRef}
        selectedFile={selectedFile}
        selectedFiles={selectedFiles}
        onFileChange={onFileChange}
        onClearFile={onClearFile}
        uploadWhatDocumentLabel={uploadWhatDocumentLabel}
        uploadMultipleMain={uploadMultipleMain}
        onUploadMultipleMainChange={onUploadMultipleMainChange}
        onMainSingleFileSelected={onMainSingleFileSelected}
      />

      {((uploadKind === "sub" && isUploading && bulkJobId && bulkProgress) || (uploadKind === "main" && uploadMultipleMain && isUploading && bulkJobId && bulkProgress)) && (
        <div className="alert alert-info py-2 mb-3" role="status">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-semibold">{t("documents.bulkUploadInProgress", { defaultValue: "Bulk upload in progress" })}</div>
              <div className="small">
                {t("documents.jobId", { defaultValue: "Job" })}: {bulkJobId} | {t("common.status")}: {bulkProgress.status ?? "processing"} | {t("documents.processed", { defaultValue: "Processed" })}: {bulkProgress.processed ?? 0}/{bulkProgress.total ?? 0} | {t("documents.failed", { defaultValue: "Failed" })}: {bulkProgress.failed ?? 0}
              </div>
            </div>
            <Button type="button" variant="outline" className="btn-outline-danger" onClick={onCancelBulkJob} disabled={isCancellingBulkJob}>
              {isCancellingBulkJob ? t("common.cancelling", { defaultValue: "Cancelling..." }) : t("documents.cancelJob", { defaultValue: "Cancel job" })}
            </Button>
          </div>
        </div>
      )}

      <UploadDocumentOptionalSection uploadKind={uploadKind} uploadMultipleMain={uploadMultipleMain} control={control} register={register} errors={errors} tagOptions={tagOptions} t={t} />
    </>
  );
}
