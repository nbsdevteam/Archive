import type { AuditLogEntry } from "../types/auditLogs.types";

/**
 * Formats a Date or ISO string to DD/MM/YYYY for the audit-logs API (date_from, date_to).
 */
export const formatDateForActivityApi = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Converts a snake_case action code into a readable fallback label.
 */
export const humanizeAction = (action: string): string => {
  if (!action) return "Unknown";
  return action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

/**
 * Formats an audit timestamp for table, timeline and tree views.
 */
export const formatAuditTimestamp = (value?: string | null): string => {
  if (!value) return "–";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "–";
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Groups logs by the local date key (YYYY-MM-DD).
 */
export const groupLogsByDay = (logs: AuditLogEntry[]): Record<string, AuditLogEntry[]> => {
  return logs.reduce<Record<string, AuditLogEntry[]>>((acc, log) => {
    const date = new Date(log.timestamp);
    const key = Number.isNaN(date.getTime()) ? "unknown" : date.toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});
};

/**
 * Groups logs for the tree view by document or by action.
 */
export const groupLogsForTree = (
  logs: AuditLogEntry[],
  groupBy: "document" | "action"
): Record<string, AuditLogEntry[]> => {
  return logs.reduce<Record<string, AuditLogEntry[]>>((acc, log) => {
    const key =
      groupBy === "document"
        ? log.document_title || `Document #${log.document_id ?? "N/A"}`
        : humanizeAction(log.action);
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});
};
