/**
 * Returns the base name of a file (name without extension).
 * Handles edge cases like no extension or multiple dots (e.g. "report.final.pdf" -> "report.final").
 */
export function getBaseName(fileName: string): string {
  const trimmed = (fileName ?? "").trim();
  if (!trimmed) return trimmed;
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0) return trimmed;
  return trimmed.slice(0, lastDot);
}

/**
 * Sanitizes a string for use as a folder code: lowercase, replace spaces/special chars with underscore.
 * Suitable for auto-generated folder_code from filename base name.
 */
export function toFolderCode(baseName: string): string {
  const trimmed = (baseName ?? "").trim();
  if (!trimmed) return trimmed;
  return trimmed
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || trimmed;
}
