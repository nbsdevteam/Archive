/**
 * Field path for validation issues (supports nested fields, e.g. ["items", 0, "name"]).
 */
export type Path = (string | number)[];

/**
 * Single validation issue: path, message, and optional error code (e.g. "custom", "required").
 */
export interface ValidationIssue {
  path: Path;
  message: string;
  code?: string;
}

/**
 * Result of running a validator: normalized values and zero or more issues.
 * Validators are pure functions; no React state.
 */
export interface ValidationResult<T> {
  values: T;
  issues: ValidationIssue[];
}

/**
 * Validator function signature: accepts raw values, returns result with normalized values and issues.
 */
export type Validator<T> = (values: T) => ValidationResult<T>;
