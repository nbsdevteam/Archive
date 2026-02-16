import type { Path } from "./types";

const DEFAULT_CODE = "custom";

/**
 * Adds an issue to the issues array. Reusable for all rule helpers (DRY).
 */
export function addIssue(
  issues: { path: Path; message: string; code?: string }[],
  path: Path,
  message: string,
  code: string = DEFAULT_CODE
): void {
  issues.push({ path, message, code });
}

/**
 * Returns true if value is a non-empty string after trim; otherwise false.
 */
export function isNonEmptyTrimmed(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Coerces to number; returns NaN for empty string or invalid input.
 */
export function coerceNumber(value: unknown): number {
  if (value === "" || value === undefined || value === null) return Number.NaN;
  if (typeof value === "number") return Number.isNaN(value) ? Number.NaN : value;
  const n = Number(value);
  return Number.isNaN(n) ? Number.NaN : n;
}

/**
 * Validates required non-empty trimmed string at path. Adds issue and returns false if invalid.
 */
export function requiredTrimmedString(
  issues: { path: Path; message: string; code?: string }[],
  path: Path,
  value: unknown,
  message: string
): boolean {
  if (isNonEmptyTrimmed(value)) return true;
  addIssue(issues, path, message, "required");
  return false;
}

/**
 * Returns trimmed string or empty string; does not add issues (optional field).
 */
export function optionalTrimmedString(value: unknown): string {
  if (value == null) return "";
  return typeof value === "string" ? value.trim() : String(value).trim();
}

/**
 * Validates number >= 1 at path. Coerces input to number; treats NaN/empty as invalid.
 */
export function requiredNumberMin1(
  issues: { path: Path; message: string; code?: string }[],
  path: Path,
  value: unknown,
  message: string
): boolean {
  const n = coerceNumber(value);
  if (typeof n === "number" && !Number.isNaN(n) && n >= 1) return true;
  addIssue(issues, path, message, "min");
  return false;
}

/**
 * Coerces to number; returns undefined for empty/NaN (optional numeric field).
 */
export function optionalNumber(value: unknown): number | undefined {
  const n = coerceNumber(value);
  if (Number.isNaN(n) || n < 1) return undefined;
  return n;
}

/**
 * Validates that value is a File instance. Adds issue if not.
 */
export function requiredFile(
  issues: { path: Path; message: string; code?: string }[],
  path: Path,
  value: unknown,
  message: string
): boolean {
  if (value instanceof File) return true;
  addIssue(issues, path, message, DEFAULT_CODE);
  return false;
}

/**
 * Validates value is one of the allowed strings. Used for enums like confidentiality_level.
 */
export function oneOf<K extends string>(
  issues: { path: Path; message: string; code?: string }[],
  path: Path,
  value: unknown,
  allowed: readonly K[],
  defaultVal: K
): K {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) return value as K;
  return defaultVal;
}

/**
 * Ensures array of numbers; returns empty array for invalid/empty input.
 */
export function optionalNumberArray(value: unknown): number[] {
  if (Array.isArray(value) && value.every((x) => typeof x === "number" && !Number.isNaN(x))) return value;
  return [];
}
