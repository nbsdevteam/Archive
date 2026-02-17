import type { TFunction } from "i18next";
import {
  createValidationResolver,
  requiredTrimmedString,
  optionalTrimmedString,
  addIssue,
} from "@/shared/utils/form/validation";
import type { Validator } from "@/shared/utils/form/validation";
import type { CreateCompanyFormValues } from "./CreateCompanySidePanel";

const PATH_NAME = ["name"];
const PATH_EMAIL = ["email"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Builds the create-company validator (name required; email format if provided). Pure function.
 */
export function makeCreateCompanyValidator(
  t: TFunction
): Validator<CreateCompanyFormValues> {
  return (values: CreateCompanyFormValues) => {
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
    const name = optionalTrimmedString(values.name);
    const countryIso2 = typeof values.countryIso2 === "string" ? values.countryIso2.trim() : "";
    const dialCode = typeof values.dialCode === "string" ? values.dialCode.replace(/\D/g, "") : "";
    const nationalNumber = optionalTrimmedString(values.nationalNumber ?? "");
    const vat = optionalTrimmedString(values.vat);
    const street = optionalTrimmedString(values.street);
    const city = optionalTrimmedString(values.city);
    const website = optionalTrimmedString(values.website);
    return {
      values: {
        name,
        countryIso2: countryIso2 || undefined,
        dialCode: dialCode || undefined,
        nationalNumber: nationalNumber || undefined,
        email: email || undefined,
        vat,
        street,
        city,
        website,
      },
      issues,
    };
  };
}

/**
 * Returns a stable RHF resolver for the create-company form.
 */
export function createCreateCompanyResolver(t: TFunction) {
  return createValidationResolver(makeCreateCompanyValidator(t));
}
