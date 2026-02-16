import { toNestErrors } from "@hookform/resolvers";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldError, FieldValues, Resolver, ResolverOptions, ResolverResult } from "react-hook-form";
import { appendErrors } from "react-hook-form";

/** Zod issue shape used by both Zod 3 (.errors) and Zod 4 (.issues). */
interface ZodIssueLike {
  path: (string | number)[];
  code?: string;
  message: string;
  unionErrors?: { errors: ZodIssueLike[] }[];
  errors?: ZodIssueLike[][];
}

/**
 * Detects ZodError from either Zod 3 (error.errors) or Zod 4 (error.issues).
 * @hookform/resolvers only checks error.errors, so Zod 4 validation failures are rethrown and show as uncaught.
 */
function isZodError(err: unknown): err is { errors?: ZodIssueLike[]; issues?: ZodIssueLike[] } {
  const e = err as { errors?: unknown; issues?: unknown } | null | undefined;
  return Array.isArray(e?.issues) || Array.isArray(e?.errors);
}

/** Returns the issues array from a ZodError (Zod 4 uses .issues, Zod 3 uses .errors getter). */
function getZodIssues(err: { errors?: ZodIssueLike[]; issues?: ZodIssueLike[] }): ZodIssueLike[] {
  return err.issues ?? err.errors ?? [];
}

/**
 * Converts Zod issues into a flat Record of field path -> FieldError for react-hook-form.
 * Handles unionErrors (Zod 3) and invalid_union .errors (Zod 4).
 */
function parseErrorSchema(
  zodErrors: ZodIssueLike[],
  validateAllFieldCriteria: boolean
): Record<string, FieldError> {
  const errors: Record<string, FieldError> = {};
  const queue = [...zodErrors];

  while (queue.length > 0) {
    const error = queue.shift()!;
    const path = error.path ?? [];
    const _path = path.join(".");
    const code = (error.code as string) ?? "custom";
    const message = error.message ?? "Invalid";

    if (!errors[_path]) {
      if ("unionErrors" in error && Array.isArray(error.unionErrors) && error.unionErrors[0]?.errors?.[0]) {
        const first = error.unionErrors[0].errors[0];
        errors[_path] = { message: first.message, type: (first.code as string) ?? "custom" };
      } else if ("errors" in error && Array.isArray(error.errors) && error.errors[0]?.[0]) {
        const first = error.errors[0][0];
        errors[_path] = { message: first.message, type: (first.code as string) ?? "custom" };
      } else {
        errors[_path] = { message, type: code };
      }
    }

    if ("unionErrors" in error && Array.isArray(error.unionErrors)) {
      for (const u of error.unionErrors) {
        if (Array.isArray(u.errors)) u.errors.forEach((e) => queue.push(e));
      }
    }
    if ("errors" in error && Array.isArray(error.errors)) {
      for (const arr of error.errors) {
        if (Array.isArray(arr)) arr.forEach((e) => queue.push(e));
      }
    }

    if (validateAllFieldCriteria && errors[_path]) {
      const types = errors[_path].types;
      const messages = types && (types as Record<string, string[]>)[code];
      errors[_path] = appendErrors(
        _path,
        validateAllFieldCriteria,
        errors,
        code,
        messages ? [...messages, message] : message
      ) as FieldError;
    }
  }

  return errors;
}

/**
 * Wraps @hookform/resolvers zodResolver so that Zod 4 validation errors are turned into
 * form errors instead of uncaught promise rejections.
 * @hookform/resolvers only recognizes Zod 3's error.errors; Zod 4 uses error.issues, so validation
 * failures were thrown as uncaught ZodError. This wrapper catches those and returns RHF-compatible errors.
 */
/** Infers form values type from a Zod schema for typed resolver return. */
type ZodSchemaInfer<T> = T extends { _output: infer O } ? O : FieldValues;

export function zodResolverZod4<TSchema extends Parameters<typeof zodResolver>[0]>(
  schema: TSchema,
  schemaOptions?: Parameters<typeof zodResolver>[1],
  resolverOptions?: Parameters<typeof zodResolver>[2]
): Resolver<ZodSchemaInfer<TSchema>> {
  const base = zodResolver(schema, schemaOptions, resolverOptions) as Resolver<ZodSchemaInfer<TSchema>>;

  type TFieldValues = ZodSchemaInfer<TSchema>;
  const wrapped: Resolver<TFieldValues> = async (
    values: TFieldValues,
    context: unknown,
    options: ResolverOptions<TFieldValues>
  ): Promise<ResolverResult<TFieldValues>> => {
    try {
      return await base(values, context, options);
    } catch (err) {
      if (isZodError(err)) {
        const issues = getZodIssues(err);
        const validateAllFieldCriteria =
          !options.shouldUseNativeValidation && options.criteriaMode === "all";
        return {
          values: {} as TFieldValues,
          errors: toNestErrors(
            parseErrorSchema(issues, validateAllFieldCriteria),
            options
          ),
        };
      }
      throw err;
    }
  };
  return wrapped;
}
