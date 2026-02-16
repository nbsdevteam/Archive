import { toNestErrors } from "@hookform/resolvers";
import type { FieldError, FieldValues, Resolver, ResolverOptions, ResolverResult } from "react-hook-form";
import { appendErrors } from "react-hook-form";
import type { ValidationIssue, Validator } from "./types";

/**
 * Converts validation issues into a flat Record of field path -> FieldError for react-hook-form.
 * When criteriaMode is "all", multiple issues per path are merged via appendErrors.
 */
function issuesToFlatErrors(
  issues: ValidationIssue[],
  validateAllFieldCriteria: boolean
): Record<string, FieldError> {
  const errors: Record<string, FieldError> = {};
  for (const issue of issues) {
    const path = issue.path ?? [];
    const key = path.join(".");
    const code = issue.code ?? "custom";
    const message = issue.message ?? "Invalid";

    if (validateAllFieldCriteria) {
      errors[key] = appendErrors(key, true, errors, code, message) as FieldError;
    } else {
      if (!errors[key]) {
        errors[key] = { message, type: code };
      }
    }
  }
  return errors;
}

/**
 * Creates an RHF Resolver from a custom validator function.
 * Uses @hookform/resolvers toNestErrors so shouldFocus and nested error shape work as expected.
 * Validator is pure; no extra rerenders. Memoize the resolver in the component: useMemo(() => createValidationResolver(validator), [validator]).
 */
export function createValidationResolver<TFieldValues extends FieldValues>(
  validate: Validator<TFieldValues>
): Resolver<TFieldValues> {
  return (values, _context, options: ResolverOptions<TFieldValues>): ResolverResult<TFieldValues> => {
    const result = validate(values);
    if (result.issues.length === 0) {
      return { values: result.values, errors: {} };
    }
    const validateAllFieldCriteria =
      !options.shouldUseNativeValidation && options.criteriaMode === "all";
    const flatErrors = issuesToFlatErrors(result.issues, validateAllFieldCriteria);
    return {
      values: {},
      errors: toNestErrors(flatErrors, options),
    } as ResolverResult<TFieldValues>;
  };
}
