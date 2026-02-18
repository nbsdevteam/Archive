/**
 * Edit-folder form validation. Name and code required.
 */

import type { TFunction } from "i18next";
import {
  createValidationResolver,
  requiredTrimmedString,
  optionalTrimmedString,
} from "@/shared/utils/form/validation";
import type { EditFolderFormValues } from "../components/EditFolderSidePanel";
import type { Validator } from "@/shared/utils/form/validation";

const PATH_NAME = ["name"];
const PATH_CODE = ["code"];

/**
 * Builds the edit-folder validator with translated messages. Pure function; no React state.
 */
export function makeEditFolderValidator(t: TFunction): Validator<EditFolderFormValues> {
  return (values: EditFolderFormValues) => {
    const issues: { path: (string | number)[]; message: string; code?: string }[] = [];
    requiredTrimmedString(issues, PATH_NAME, values.name, t("folders.validation.nameRequired"));
    requiredTrimmedString(issues, PATH_CODE, values.code, t("folders.validation.codeRequired"));
    const name = optionalTrimmedString(values.name);
    const code = optionalTrimmedString(values.code);
    const description = optionalTrimmedString(values.description);
    const company_id =
      typeof values.company_id === "number" && !Number.isNaN(values.company_id) && values.company_id >= 1
        ? values.company_id
        : 0;
    return {
      values: { name, code, description, company_id },
      issues,
    };
  };
}

/**
 * Returns a stable RHF resolver for the edit-folder form. Use in useForm with useMemo(..., [t]).
 */
export function createEditFolderResolver(t: TFunction) {
  return createValidationResolver(makeEditFolderValidator(t));
}
