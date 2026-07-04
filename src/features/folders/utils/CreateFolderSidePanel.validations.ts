/**
 * Create-folder form validation. Name, code, and department are required.
 */

import type { TFunction } from "i18next";
import {
  createValidationResolver,
  requiredTrimmedString,
  optionalTrimmedString,
} from "@/shared/utils/form/validation";
import type { CreateFolderFormValues } from "../components/CreateFolderSidePanel";
import type { Validator } from "@/shared/utils/form/validation";

const PATH_NAME = ["name"];
const PATH_CODE = ["code"];
const PATH_DEPARTMENT = ["department_id"];

/**
 * Builds the create-folder validator with translated messages. Pure function; no React state.
 */
export function makeCreateFolderValidator(t: TFunction): Validator<CreateFolderFormValues> {
  return (values: CreateFolderFormValues) => {
    const issues: { path: (string | number)[]; message: string; code?: string }[] = [];
    requiredTrimmedString(issues, PATH_NAME, values.name, t("folders.validation.nameRequired"));
    requiredTrimmedString(issues, PATH_CODE, values.code, t("folders.validation.codeRequired"));
    if (!values.department_id || values.department_id < 1) {
      issues.push({ path: PATH_DEPARTMENT, message: t("folders.validation.departmentRequired") });
    }
    const name = optionalTrimmedString(values.name);
    const code = optionalTrimmedString(values.code);
    const description = optionalTrimmedString(values.description);
    const department_id = values.department_id ?? 0;
    const folder_type = values.folder_type ?? "";
    const company_id =
      typeof values.company_id === "number" && !Number.isNaN(values.company_id) && values.company_id >= 1
        ? values.company_id
        : 0;
    return {
      values: { name, code, description, department_id, folder_type, company_id },
      issues,
    };
  };
}

/**
 * Returns a stable RHF resolver for the create-folder form. Use in useForm with useMemo(..., [t]).
 */
export function createCreateFolderResolver(t: TFunction) {
  return createValidationResolver(makeCreateFolderValidator(t));
}
