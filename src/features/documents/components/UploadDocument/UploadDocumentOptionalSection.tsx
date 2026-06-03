import type { TFunction } from "i18next";
import type { Control, FieldErrors } from "react-hook-form";
import type { UploadFormValues } from "./types";
import { Input, MultiSelectField, DateField } from "@/shared/components/ui";
import type { SelectOption } from "@/shared/components/ui";
import { Icon } from "@/shared/components/ui";

export interface UploadDocumentOptionalSectionProps {
  uploadKind: "main" | "sub" | "attachment";
  /** When true (main + multiple files), searchable numbers (PO, BL, etc.) are hidden. */
  uploadMultipleMain?: boolean;
  /** When true (sub + multiple files), searchable numbers are hidden. */
  uploadMultipleSub?: boolean;
  control: Control<UploadFormValues>;
  register: (name: keyof UploadFormValues, options?: object) => object;
  errors: FieldErrors<UploadFormValues>;
  tagOptions: SelectOption[];
  t: TFunction;
}

/** Optional searchable numbers and tags section; shown only for main/sub uploads. Hides searchable numbers when upload multiple files is checked (main). */
export function UploadDocumentOptionalSection({
  uploadKind,
  uploadMultipleMain = false,
  uploadMultipleSub = false,
  control,
  register,
  errors,
  tagOptions,
  t,
}: UploadDocumentOptionalSectionProps) {
  if (uploadKind === "attachment") return null;

  const hideSearchableNumbers = (uploadKind === "main" && uploadMultipleMain) || (uploadKind === "sub" && uploadMultipleSub);

  return (
    <>
      {!hideSearchableNumbers && (
        <>
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
        </>
      )}
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
    </>
  );
}
