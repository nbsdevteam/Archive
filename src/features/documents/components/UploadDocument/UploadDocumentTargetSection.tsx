import type { TFunction } from "i18next";
import type { Control, UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { UploadFormValues } from "./types";
import { Input, SelectField, InfoWrapper } from "../../../../shared/components/ui";
import type { SelectOption } from "../../../../shared/components/ui";
import { FOLDER_TYPE_VALUES } from "../../../../shared/constants/folderTypeOptions";
import type { Department } from "../../../../app/adapter/api/admin.api";
import type { DocumentType } from "../../../../app/adapter/api/admin.api";
import type { Folder } from "../../../folders/types/folders.types";

export interface UploadDocumentTargetSectionProps {
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
  t: TFunction;
  fillFolderNameFromTitle: (titleValue: string) => void;
}

const UPLOAD_KIND_OPTIONS = (t: TFunction): SelectOption<string>[] => [
  { value: "main", label: t("documents.mainDocument") },
  { value: "sub", label: t("documents.subDocument") },
  { value: "attachment", label: t("documents.attachment") },
];

const CONFIDENTIALITY_OPTIONS = (t: TFunction): SelectOption<string>[] => [
  { value: "internal", label: t("documents.confidentiality.internal") },
  { value: "public", label: t("documents.confidentiality.public") },
  { value: "confidential", label: t("documents.confidentiality.confidential") },
  { value: "strict", label: t("documents.confidentiality.strict") },
];

/** Target and metadata fields: upload type, target doc, department, doc type, title, folder, new folder, confidentiality. */
export function UploadDocumentTargetSection({
  control,
  register,
  errors,
  uploadKind,
  departmentId,
  folderId,
  lockFolderContext,
  initialValues,
  departments,
  documentTypes,
  folders,
  t,
  fillFolderNameFromTitle,
}: UploadDocumentTargetSectionProps) {
  const titleRegistration = register("title");
  const departmentOptions: SelectOption[] = departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }));
  const documentTypeOptions: SelectOption[] = documentTypes.map((dt) => ({ value: dt.id, label: `${dt.name} (${dt.code})` }));
  const folderOptions: SelectOption[] = [
    { value: 0, label: t("common.none", { defaultValue: "None" }) },
    ...folders.map((f) => ({ value: f.id, label: `${f.name} — ${f.code}` })),
  ];
  const folderTypeOptions: SelectOption<string>[] = FOLDER_TYPE_VALUES.map((value) => ({
    value,
    label: t(`documents.folderTypeOptions.${value}`, { defaultValue: value }),
  }));

  return (
    <>
      <h6 className="fw-semibold mb-2">{t("documents.basicDocumentInfo", { defaultValue: "Basic document info" })}</h6>
      <div className="d-flex flex-column gap-2">
        <label className="form-label d-flex align-items-center gap-1">
          {t("documents.uploadType", { defaultValue: "Upload type" })}
          <InfoWrapper content={t("documents.uploadTypeMainDocumentInfo")} triggerClassName="text-muted" />
        </label>
        <SelectField
          control={control}
          name="upload_kind"
          options={UPLOAD_KIND_OPTIONS(t)}
          isStringValue
          isDisabled={lockFolderContext}
          isClearable={false}
          error={errors.upload_kind?.message as string | undefined}
        />
      </div>

      {uploadKind === "attachment" && (
        <Input
          label={t("documents.targetDocumentId", { defaultValue: "Target document ID" })}
          type="number"
          {...register("target_document_id", { valueAsNumber: true })}
          error={errors.target_document_id?.message}
          required
          disabled={initialValues?.target_document_id != null && Number(initialValues.target_document_id) >= 1}
        />
      )}

      {uploadKind !== "attachment" && (
        <>
          <SelectField
            control={control}
            name="department_id"
            options={departmentOptions}
            label={t("documents.department", { defaultValue: "Department" })}
            placeholder={t("common.selectDepartment", { defaultValue: "Select department" })}
            required
            isDisabled={lockFolderContext}
            error={errors.department_id?.message as string | undefined}
          />
          <SelectField
            control={control}
            name="document_type_id"
            options={documentTypeOptions}
            label={t("documents.documentType", { defaultValue: "Document type" })}
            placeholder={departmentId ? t("common.selectDocumentType") : t("common.selectDepartmentFirst")}
            isDisabled={!departmentId || departmentId < 1}
            required
            error={errors.document_type_id?.message as string | undefined}
          />
        </>
      )}

      {uploadKind !== "attachment" && (
        <Input
          label={t("documents.documentTitle", { defaultValue: "Document title" })}
          {...titleRegistration}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            titleRegistration.onBlur(e);
            fillFolderNameFromTitle(e.target.value ?? "");
          }}
          error={errors.title?.message}
          required
          autoComplete="off"
        />
      )}

      {uploadKind !== "attachment" && (
        <>
          {uploadKind === "sub" && (
            <SelectField
              control={control}
              name="folder_id"
              options={folderOptions}
              label={t("documents.linkToFolder", { defaultValue: "Link to folder" })}
              placeholder={t("common.none", { defaultValue: "None" })}
              required
              isDisabled={lockFolderContext || !departmentId || departmentId < 1}
              allowZero
              error={errors.folder_id?.message as string | undefined}
            />
          )}

          {uploadKind === "main" && (
            <>
              <Input
                label={t("documents.newFolderName", { defaultValue: "New folder name" })}
                {...register("folder_name")}
                error={errors.folder_name?.message}
                autoComplete="off"
                required={!lockFolderContext}
                disabled={lockFolderContext}
              />
              <Input
                label={t("documents.newFolderCode", { defaultValue: "New folder code" })}
                {...register("folder_code")}
                error={errors.folder_code?.message}
                autoComplete="off"
                required={!lockFolderContext}
                disabled={lockFolderContext}
              />
              <SelectField
                control={control}
                name="folder_type"
                options={folderTypeOptions}
                label={t("documents.folderType", { defaultValue: "Folder type" })}
                placeholder={t("common.other", { defaultValue: "Other" })}
                isStringValue
                isDisabled={lockFolderContext}
                error={errors.folder_type?.message as string | undefined}
              />
              <div className="mb-3">
                <label className="form-label">{t("documents.folderDescription", { defaultValue: "Folder description" })}</label>
                <textarea className="form-control" {...register("folder_description")} rows={2} autoComplete="off" disabled={lockFolderContext} />
              </div>
            </>
          )}

          <SelectField
            control={control}
            name="confidentiality_level"
            options={CONFIDENTIALITY_OPTIONS(t)}
            label={t("documents.confidentialityLevel", { defaultValue: "Confidentiality level" })}
            isStringValue
            error={errors.confidentiality_level?.message as string | undefined}
          />
        </>
      )}
    </>
  );
}
