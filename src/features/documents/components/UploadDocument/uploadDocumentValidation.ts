import type { TFunction } from "i18next";
import {
  addIssue,
  createValidationResolver,
  oneOf,
  optionalNumber,
  optionalNumberArray,
  optionalTrimmedString,
  requiredFile,
  requiredNumberMin1,
  requiredTrimmedString,
} from "@/shared/utils/form/validation";
import type { UploadFormValues } from "./types";
import type { Validator } from "@/shared/utils/form/validation";

const CONFIDENTIALITY_LEVELS = ["public", "internal", "confidential", "strict"] as const;

/**
 * Builds the upload-document validator with translated messages. Replicates previous Zod
 * logic: attachment (target_document_id + file); main/sub (department, document_type;
 * conditional title/folder_name/folder_code/file and folder_id for sub).
 */
export function makeUploadDocumentValidator(t: TFunction): Validator<UploadFormValues> {
  return (values: UploadFormValues) => {
    const issues: { path: (string | number)[]; message: string; code?: string }[] = [];
    const kind = values.upload_kind ?? "main";
    const uploadMultipleMain = kind === "main" && (values.upload_multiple_main === true);
    const uploadMultipleSub = kind === "sub" && (values.upload_multiple_sub === true);

    if (kind === "attachment") {
      requiredNumberMin1(
        issues,
        ["target_document_id"],
        values.target_document_id,
        t("documents.validation.targetDocumentIdRequired")
      );
      requiredFile(issues, ["file"], values.file, t("documents.validation.fileRequired"));
    } else {
      requiredNumberMin1(
        issues,
        ["department_id"],
        values.department_id,
        t("documents.validation.departmentRequired")
      );
      requiredNumberMin1(
        issues,
        ["document_type_id"],
        values.document_type_id,
        t("documents.validation.documentTypeRequired")
      );

      if (kind === "main") {
        requiredNumberMin1(issues, ["folder_company_id"], values.folder_company_id, t("documents.validation.folderCompanyRequired", { defaultValue: "Folder company is required" }));
        if (!uploadMultipleMain) {
          requiredTrimmedString(issues, ["title"], values.title, t("documents.validation.titleRequired"));
          requiredTrimmedString(issues, ["folder_name"], values.folder_name, t("documents.validation.folderNameRequired"));
          requiredTrimmedString(issues, ["folder_code"], values.folder_code, t("documents.validation.folderCodeRequired"));
          requiredFile(issues, ["file"], values.file, t("documents.validation.fileRequired"));
        }
      }
      if (kind === "sub") {
        const fid = values.folder_id;
        if (fid == null || Number(fid) < 1) {
          addIssue(issues, ["folder_id"], t("documents.validation.folderRequiredForSubDocument"), "custom");
        }
        if (!uploadMultipleSub) {
          requiredFile(issues, ["file"], values.file, t("documents.validation.fileRequired"));
        }
      }
    }

    const department_id =
      typeof values.department_id === "number" && !Number.isNaN(values.department_id) && values.department_id >= 1
        ? values.department_id
        : 0;
    const document_type_id =
      typeof values.document_type_id === "number" &&
      !Number.isNaN(values.document_type_id) &&
      values.document_type_id >= 1
        ? values.document_type_id
        : 0;
    const target_document_id = kind === "attachment" ? optionalNumber(values.target_document_id) : undefined;
    const folder_id = optionalNumber(values.folder_id);
    const confidentiality_level = oneOf(
      issues,
      ["confidentiality_level"],
      values.confidentiality_level,
      CONFIDENTIALITY_LEVELS,
      "internal"
    );
    const tags = optionalNumberArray(values.tags);

    const normalized: UploadFormValues = {
      upload_kind: kind,
      upload_multiple_main: values.upload_multiple_main,
      upload_multiple_sub: values.upload_multiple_sub,
      target_document_id,
      department_id,
      document_type_id,
      title: optionalTrimmedString(values.title),
      file: values.file,
      folder_id: folder_id ?? undefined,
      create_folder: values.create_folder,
      folder_name: optionalTrimmedString(values.folder_name),
      folder_code: optionalTrimmedString(values.folder_code),
      folder_type: optionalTrimmedString(values.folder_type) || "other",
      folder_description: optionalTrimmedString(values.folder_description),
      folder_company_id: typeof values.folder_company_id === "number" ? values.folder_company_id : 0,
      confidentiality_level,
      po_number: optionalTrimmedString(values.po_number),
      bl_number: optionalTrimmedString(values.bl_number),
      container_number: optionalTrimmedString(values.container_number),
      invoice_number: optionalTrimmedString(values.invoice_number),
      envoy_number: optionalTrimmedString(values.envoy_number),
      tags,
    };

    return { values: normalized, issues };
  };
}

/**
 * Returns a stable RHF resolver for the upload-document form. Use in useForm with useMemo(..., [t]).
 */
export function createUploadDocumentResolver(t: TFunction) {
  return createValidationResolver(makeUploadDocumentValidator(t));
}
