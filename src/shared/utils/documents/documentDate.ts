/**
 * Helpers for API `document_date`: server returns dd-mm-yyyy or null; writes accept several formats.
 * HTML date inputs use yyyy-mm-dd.
 */

/** Display in tables/detail: em dash when missing. */
export function formatDocumentDateDisplay(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "—";
  return String(value).trim();
}

/**
 * Parses API date (dd-mm-yyyy, yyyy-mm-dd, or dd/mm/yyyy) to yyyy-mm-dd for `<input type="date">`.
 * Returns empty string if null/invalid.
 */
export function apiDocumentDateToHtmlInput(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "";
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }
  return "";
}

/** Value from `<input type="date">` for API write; empty clears (caller sends null). */
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
