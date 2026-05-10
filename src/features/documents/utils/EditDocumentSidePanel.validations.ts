/**
 * Edit-document form validation. Title, department_id, document_type_id required.
 */

import type { TFunction } from "i18next";
import {
  createValidationResolver,
  oneOf,
  optionalNumber,
  optionalNumberArray,
  optionalTrimmedString,
  requiredNumberMin1,
  requiredTrimmedString,
} from "@/shared/utils/form/validation";
import type { EditDocumentFormValues } from "../components/EditDocument/types";
import type { Validator } from "@/shared/utils/form/validation";

const CONFIDENTIALITY_LEVELS = ["public", "internal", "confidential", "strict"] as const;

/**
 * Builds the edit-document validator with translated messages. Required: title, department_id, document_type_id.
 * Optional: folder_id, strings, tags, changeDescription, unlockToken.
 */
export function makeEditDocumentValidator(t: TFunction): Validator<EditDocumentFormValues> {
  return (values: EditDocumentFormValues) => {
    const issues: { path: (string | number)[]; message: string; code?: string }[] = [];
    requiredTrimmedString(issues, ["title"], values.title, t("documents.validation.titleRequired"));
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

    const title = optionalTrimmedString(values.title);
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
    const confidentiality_level = oneOf(
      issues,
      ["confidentiality_level"],
      values.confidentiality_level,
      CONFIDENTIALITY_LEVELS,
      "internal"
    );
    const folder_id = optionalNumber(values.folder_id);

    const normalized: EditDocumentFormValues = {
      title,
      department_id,
      document_type_id,
      confidentiality_level,
      folder_id: folder_id ?? undefined,
      po_number: optionalTrimmedString(values.po_number),
      bl_number: optionalTrimmedString(values.bl_number),
      container_number: optionalTrimmedString(values.container_number),
      invoice_number: optionalTrimmedString(values.invoice_number),
      envoy_number: optionalTrimmedString(values.envoy_number),
      tags: optionalNumberArray(values.tags),
      document_date: optionalTrimmedString(values.document_date),
      changeDescription: optionalTrimmedString(values.changeDescription),
      unlockToken: optionalTrimmedString(values.unlockToken),
    };

    return { values: normalized, issues };
  };
}

/**
 * Returns a stable RHF resolver for the edit-document form. Use in useForm with useMemo(..., [t]).
 */
export function createEditDocumentResolver(t: TFunction) {
  return createValidationResolver(makeEditDocumentValidator(t));
}
