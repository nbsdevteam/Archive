import type { RefObject } from "react";
import type { TFunction } from "i18next";
import type { Control, UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { EditDocumentFormValues } from "./types";
import type { SelectOption } from "@/shared/components/ui";
import type { Department } from "@/app/adapter/api/admin.api";
import type { DocumentType } from "@/app/adapter/api/admin.api";
import type { Folder } from "@/app/adapter/api/folders.types";
import { Input, SelectField, MultiSelectField, DateField, Icon, Button } from "@/shared/components/ui";

const CONFIDENTIALITY_OPTIONS = (t: TFunction): SelectOption<string>[] => [
  { value: "internal", label: t("documents.confidentiality.internal") },
  { value: "public", label: t("documents.confidentiality.public") },
  { value: "confidential", label: t("documents.confidentiality.confidential") },
  { value: "strict", label: t("documents.confidentiality.strict") },
];

export interface EditDocumentFormContentProps {
  control: Control<EditDocumentFormValues>;
  register: UseFormRegister<EditDocumentFormValues>;
  errors: FieldErrors<EditDocumentFormValues>;
  setValue: UseFormSetValue<EditDocumentFormValues>;
  isSubDoc: boolean;
  isInFolder: boolean;
  /** Folder display name from API; shown in disabled "Link to folder" field when document is in a folder. */
  folderName?: string | null;
  /** Company name from folder (if document has company_id); shown read-only. */
  companyName?: string | null;
  departmentId: number;
  departments: Department[];
  documentTypes: DocumentType[];
  folders: Folder[];
  tagOptions: SelectOption[];
  isLocked: boolean;
  replaceFile: File | null | undefined;
  replaceFileInputRef: RefObject<HTMLInputElement | null>;
  onReplaceFileChange: (file: File | null) => void;
  onClearReplaceFile: () => void;
  t: TFunction;
}

/** Edit form body: basic metadata, optional numbers/tags, replace-file section. */
export function EditDocumentFormContent({
  control,
  register,
  errors,
  setValue: _setValue,
  isSubDoc,
  isInFolder,
  folderName,
  companyName,
  departmentId,
  departments,
  documentTypes,
  folders,
  tagOptions,
  isLocked,
  replaceFile,
  replaceFileInputRef,
  onReplaceFileChange,
  onClearReplaceFile,
  t,
}: EditDocumentFormContentProps) {
  const departmentOptions: SelectOption[] = departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }));
  const documentTypeOptions: SelectOption[] = documentTypes.map((dt) => ({ value: dt.id, label: `${dt.name} (${dt.code})` }));
  const folderOptions: SelectOption[] = [
    { value: 0, label: t("common.none", { defaultValue: "None" }) },
    ...folders.map((f) => ({ value: f.id, label: `${f.name} — ${f.code}` })),
  ];
  /** Show "Link to folder" when document is in a folder (sub-doc or main in folder); always disabled and populated with folder_name. */
  const showLinkToFolder = isSubDoc || isInFolder;

  /** Updates replace-file selection from file input. */
  const handleReplaceFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onReplaceFileChange(e.target.files?.[0] ?? null);
  };

  return (
    <>
      <h6 className="fw-semibold mb-2">{t("documents.basicDocumentInfo", { defaultValue: "Basic document info" })}</h6>
      {(isSubDoc || isInFolder) && (
        <div className="alert alert-info py-2 mb-2 small">
          <Icon name="info" className="me-1" />
          {isSubDoc
            ? t("documents.editRestrictionSubDoc", { defaultValue: "Department, document type, and link to folder cannot be changed for secondary documents." })
            : t("documents.editRestrictionFolder", { defaultValue: "Department cannot be changed for documents in folders." })}
        </div>
      )}
      <div className="d-flex flex-column gap-2 mb-3">
        <SelectField
          control={control}
          name="department_id"
          options={departmentOptions}
          label={t("documents.department", { defaultValue: "Department" })}
          placeholder={t("common.selectDepartment", { defaultValue: "Select department" })}
          required
          error={errors.department_id?.message as string | undefined}
          isDisabled={isSubDoc || isInFolder}
          data-testid="edit-department-select"
        />
        <SelectField
          control={control}
          name="document_type_id"
          options={documentTypeOptions}
          label={t("documents.documentType", { defaultValue: "Document type" })}
          placeholder={departmentId ? t("common.selectDocumentType") : t("common.selectDepartmentFirst")}
          isDisabled={isSubDoc || !departmentId || departmentId < 1}
          required
          error={errors.document_type_id?.message as string | undefined}
          data-testid="edit-document-type-select"
        />
        <Input
          label={t("documents.documentTitle", { defaultValue: "Document title" })}
          {...register("title")}
          error={errors.title?.message}
          required
          autoComplete="off"
        />
        {showLinkToFolder && (
          folderName ? (
            <Input
              label={t("documents.linkToFolder", { defaultValue: "Link to folder" })}
              value={folderName}
              readOnly
              disabled
              autoComplete="off"
            />
          ) : (
            <SelectField
              control={control}
              name="folder_id"
              options={folderOptions}
              label={t("documents.linkToFolder", { defaultValue: "Link to folder" })}
              placeholder={t("common.none", { defaultValue: "None" })}
              allowZero
              error={errors.folder_id?.message as string | undefined}
              isDisabled
              data-testid="edit-folder-select"
            />
          )
        )}
        {companyName && (
          <Input
            label={t("documents.companyBrand", { defaultValue: "Company/Brand" })}
            value={companyName}
            readOnly
            disabled
            autoComplete="off"
          />
        )}
        <SelectField
          control={control}
          name="confidentiality_level"
          options={CONFIDENTIALITY_OPTIONS(t)}
          label={t("documents.confidentialityLevel", { defaultValue: "Confidentiality level" })}
          isStringValue
          error={errors.confidentiality_level?.message as string | undefined}
          data-testid="edit-confidentiality-select"
        />
      </div>

      <h6 className="fw-semibold mb-2 mt-2">
        <Icon name="search" className="me-1" />
        {t("documents.searchableNumbersOptional", { defaultValue: "Searchable numbers (optional)" })}
      </h6>
      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <Input label={t("documents.poNumber")} {...register("po_number")} placeholder="PO-2024-001" autoComplete="off" />
        </div>
        <div className="col-md-4">
          <Input label={t("documents.blNumber")} {...register("bl_number")} placeholder="BL-2024-001" autoComplete="off" />
        </div>
        <div className="col-md-4">
          <Input label={t("documents.containerNumber")} {...register("container_number")} placeholder="CONT-2024-001" autoComplete="off" />
        </div>
        <div className="col-md-6">
          <Input label={t("documents.invoiceNumber")} {...register("invoice_number")} placeholder="INV-2024-001" autoComplete="off" />
        </div>
        <div className="col-md-6">
          <Input label={t("documents.envoyNumber")} {...register("envoy_number")} placeholder="ENV-2024-001" autoComplete="off" />
        </div>
      </div>
      <h6 className="fw-semibold mb-2 mt-2">
        <Icon name="calendar" className="me-1" />
        {t("documents.optionalDocumentDateAndTags", { defaultValue: "Document date & tags (optional)" })}
      </h6>
      <div className="row g-2 mb-3 align-items-start">
        <div className="col-md-4 col-lg-3">
          <DateField
            control={control}
            name="document_date"
            label={t("documents.documentDate", { defaultValue: "Document date" })}
            error={errors.document_date?.message as string | undefined}
            helperText={t("documents.documentDateHint")}
            omitBottomMargin
          />
        </div>
        <div className="col-md-8 col-lg-9">
          <MultiSelectField
            control={control}
            name="tags"
            options={tagOptions}
            label={t("documents.tags", { defaultValue: "Tags" })}
            placeholder={t("common.selectTags", { defaultValue: "Select tags" })}
            error={errors.tags?.message as string | undefined}
            omitBottomMargin
          />
        </div>
      </div>
      <h6 className="fw-semibold mb-2 mt-2">
        <Icon name="bell" className="me-1" />
        {t("documents.expiryAndReminderOptional", { defaultValue: "Expiry & reminder (optional)" })}
      </h6>
      <div className="row g-2 mb-3 align-items-start">
        <div className="col-md-4 col-lg-3">
          <DateField
            control={control}
            name="expiry_date"
            label={t("documents.expiryDate", { defaultValue: "Expiry date" })}
            error={errors.expiry_date?.message as string | undefined}
            helperText={t("documents.expiryDateHint", { defaultValue: "Optional. Stored as dd-mm-yyyy." })}
            omitBottomMargin
          />
        </div>
        <div className="col-md-4 col-lg-3">
          <Input
            type="number"
            min={0}
            step={1}
            label={t("documents.reminderDays", { defaultValue: "Reminder (days before)" })}
            {...register("reminder_days", { valueAsNumber: true })}
            error={errors.reminder_days?.message as string | undefined}
            placeholder="7"
            autoComplete="off"
          />
        </div>
      </div>

      <h6 className="fw-semibold mb-2 mt-3">{t("documents.replaceFileOptional", { defaultValue: "Replace file (optional)" })}</h6>
      <p className="text-muted small mb-2">{t("documents.replaceFileCreatesNewVersion", { defaultValue: "Selecting a new file will upload it as a new version." })}</p>
      <div className="mb-3">
        <label className="form-label" htmlFor="edit-doc-replace-file">{t("documents.file", { defaultValue: "File" })}</label>
        <div className="d-flex gap-2 align-items-center">
          <input
            id="edit-doc-replace-file"
            ref={replaceFileInputRef}
            type="file"
            className="form-control"
            onChange={handleReplaceFileInputChange}
            aria-label={t("documents.file", { defaultValue: "File" })}
          />
          {replaceFile && (
            <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={onClearReplaceFile}>
              <Icon name="x" className="me-1" />
              {t("common.remove", { defaultValue: "Remove" })}
            </Button>
          )}
        </div>
        {replaceFile && <small className="text-muted d-block mt-1">{replaceFile.name}</small>}
      </div>
      <div className="mb-3">
        <Input
          label={t("documents.changeDescription", { defaultValue: "Change description" })}
          {...register("changeDescription")}
          placeholder={t("documents.changeDescriptionPlaceholder", { defaultValue: "Optional" })}
          autoComplete="off"
        />
      </div>
      {isLocked && (
        <div className="mb-3">
          <label className="form-label" htmlFor="edit-doc-unlock-token">
            {t("documents.unlockToken", { defaultValue: "Unlock token" })} {replaceFile ? "*" : ""}
          </label>
          <input
            id="edit-doc-unlock-token"
            type="text"
            className="form-control"
            {...register("unlockToken")}
            placeholder={t("documents.unlockTokenPlaceholder", { defaultValue: "Enter unlock token when replacing file" })}
            aria-label={t("documents.unlockToken", { defaultValue: "Unlock token" })}
          />
          <small className="text-muted">{t("documents.unlockTokenRequiredWhenLocked", { defaultValue: "Required when uploading a new version for a locked document." })}</small>
        </div>
      )}
    </>
  );
}
