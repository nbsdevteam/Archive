/**
 * Edit-company form validation. Name required; email format if provided.
 */

import type { TFunction } from "i18next";
import {
  createValidationResolver,
  requiredTrimmedString,
  optionalTrimmedString,
  addIssue,
} from "@/shared/utils/form/validation";
import type { Validator } from "@/shared/utils/form/validation";
import type { EditCompanyFormValues } from "../components/EditCompanySidePanel";

const PATH_NAME = ["name"];
const PATH_EMAIL = ["email"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Builds the edit-company validator with translated messages. Pure function.
 */
export function makeEditCompanyValidator(
  t: (key: string, opts?: { defaultValue?: string }) => string
): Validator<EditCompanyFormValues> {
  return (values: EditCompanyFormValues) => {
    const issues: { path: (string | number)[]; message: string; code?: string }[] = [];
    requiredTrimmedString(
      issues,
      PATH_NAME,
      values.name,
      t("companies.validation.nameRequired", { defaultValue: "Name is required." })
    );
    const email = optionalTrimmedString(values.email);
    if (email && !EMAIL_REGEX.test(email)) {
      addIssue(issues, PATH_EMAIL, t("companies.validation.invalidEmail", { defaultValue: "Please enter a valid email address." }), "pattern");
    }
    return {
      values: {
        name: optionalTrimmedString(values.name),
        countryIso2: typeof values.countryIso2 === "string" ? values.countryIso2.trim() || undefined : undefined,
        dialCode: typeof values.dialCode === "string" ? values.dialCode.replace(/\D/g, "") || undefined : undefined,
        nationalNumber: optionalTrimmedString(values.nationalNumber ?? ""),
        email: email || undefined,
        vat: optionalTrimmedString(values.vat),
        street: optionalTrimmedString(values.street),
        city: optionalTrimmedString(values.city),
        website: optionalTrimmedString(values.website),
      },
      issues,
    };
  };
}

/**
 * Returns a stable RHF resolver for the edit-company form.
 */
export function createEditCompanyResolver(t: TFunction) {
  return createValidationResolver(makeEditCompanyValidator(t));
}
