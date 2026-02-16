/**
 * Maps API response date/time fields (UTC/GMT) to Arabia Standard Time (UTC+3) display strings.
 * Use at the API response layer so the UI receives already-formatted dates and does not need to convert.
 */

import { convertToArabianStandardTime } from "./date";

/** Known API response keys that contain UTC date/time strings (ISO or similar). */
const API_DATE_KEYS = new Set([
  "upload_date",
  "created_at",
  "updated_at",
  "deleted_at",
  "restore_deadline",
  "request_date",
  "response_date",
  "create_date",
  "created_date",
  "write_date",
  "last_modified",
  "timestamp",
  "ocr_date",
  "current_version_ocr_date",
  "updated",
]);

/**
 * Recursively maps date fields in API response objects/arrays to Arabia Standard Time strings.
 * Only keys in API_DATE_KEYS are converted; nested objects (e.g. ocr, versions) are walked.
 * @param value - Raw API response (object, array, or primitive)
 * @returns Same structure with date fields replaced by AST display strings
 */
export function mapApiDatesToArabianStandardTime<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => mapApiDatesToArabianStandardTime(item)) as T;
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (API_DATE_KEYS.has(k) && typeof v === "string" && v.trim() !== "") {
        out[k] = convertToArabianStandardTime(v);
      } else {
        out[k] = mapApiDatesToArabianStandardTime(v);
      }
    }
    return out as T;
  }

  return value;
}
