import type { TFunction } from "i18next";
import {
  createValidationResolver,
  requiredTrimmedString,
  optionalTrimmedString,
} from "@/shared/utils/form/validation";
import type { Validator } from "@/shared/utils/form/validation";
import type { CreateCompanyFormValues } from "./CreateCompanySidePanel";

const PATH_NAME = ["name"];

/**
 * Builds the create-company validator (name required; rest optional). Pure function.
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
    const name = optionalTrimmedString(values.name);
    const phone = optionalTrimmedString(values.phone);
    const email = optionalTrimmedString(values.email);
    const vat = optionalTrimmedString(values.vat);
    const street = optionalTrimmedString(values.street);
    const city = optionalTrimmedString(values.city);
    const website = optionalTrimmedString(values.website);
    const country_id =
      typeof values.country_id === "number" && values.country_id >= 1
        ? values.country_id
        : undefined;
    return {
      values: { name, phone, email, vat, street, city, country_id, website },
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
