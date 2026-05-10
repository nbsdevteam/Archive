/**
 * Helpers for API `document_date`: server returns dd-mm-yyyy or null; writes accept several formats.
 * Forms use a text field with dd-mm-yyyy so day-first entry is not blocked by `type="date"` locale quirks.
 */

/** True when y/m/d is a real calendar day (local Gregorian). */
function isValidYmd(y: number, mo: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) return false;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/** Display in tables/detail: em dash when missing. */
export function formatDocumentDateDisplay(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "—";
  return String(value).trim();
}

/**
 * Parses document date strings (dd-mm-yyyy, dd/mm/yyyy, yyyy-mm-dd, yyyy/mm/dd) to yyyy-mm-dd.
 * Returns empty string if null, invalid, or not a real calendar date.
 */
export function apiDocumentDateToHtmlInput(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "";
  const s = String(value).trim().replace(/\//g, "-");
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const [ys, ms, ds] = s.split("-");
    const y = Number(ys);
    const mo = Number(ms);
    const d = Number(ds);
    if (!isValidYmd(y, mo, d)) return "";
    return `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    if (!isValidYmd(y, mo, d)) return "";
    return `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
}

/** Normalizes any accepted form/API string to zero-padded dd-mm-yyyy, or "" if invalid. */
export function toCanonicalDdMmYyyy(value: string | null | undefined): string {
  const iso = apiDocumentDateToHtmlInput(value);
  if (!iso) return "";
  const [y, mo, d] = iso.split("-");
  return `${d}-${mo}-${y}`;
}

/** Trimmed raw form value (dd-mm-yyyy after blur normalization). */
export function htmlInputDateToApiWrite(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

/**
 * Timestamp for sorting (document_date calendar day in local TZ), or null if unset/invalid.
 */
export function parseDocumentDateForSort(value: string | null | undefined): number | null {
  const html = apiDocumentDateToHtmlInput(value);
  if (!html) return null;
  const t = Date.parse(`${html}T12:00:00`);
  return Number.isNaN(t) ? null : t;
}
