import type { TFunction } from "i18next";
import type { Control, FieldErrors } from "react-hook-form";
import type { UploadFormValues } from "./types";
import { Input, MultiSelectField } from "../../../../shared/components/ui";
import type { SelectOption } from "../../../../shared/components/ui";
import { Icon } from "../../../../shared/components/ui";

export interface UploadDocumentOptionalSectionProps {
  uploadKind: "main" | "sub" | "attachment";
  control: Control<UploadFormValues>;
  register: (name: keyof UploadFormValues, options?: object) => object;
  errors: FieldErrors<UploadFormValues>;
  tagOptions: SelectOption[];
  t: TFunction;
}

/** Optional searchable numbers and tags section; shown only for main/sub uploads. */
export function UploadDocumentOptionalSection({
  uploadKind,
  control,
  register,
  errors,
  tagOptions,
  t,
}: UploadDocumentOptionalSectionProps) {
  if (uploadKind === "attachment") return null;

  return (
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
      <MultiSelectField
        control={control}
        name="tags"
        options={tagOptions}
        label={t("documents.tagsOptional", { defaultValue: "Tags (optional)" })}
        placeholder={t("common.selectTags", { defaultValue: "Select tags" })}
        error={errors.tags?.message as string | undefined}
      />
    </>
  );
}
