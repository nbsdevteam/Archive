import type { AuditLogEntry } from "../types/auditLogs.types";

/**
 * Formats a Date or ISO string to YYYY-MM-DDTHH:mm:ss for audit-logs API.
 * Use endOfDay true for date_to (23:59:59), false for date_from (00:00:00).
 */
export const formatDateForAuditApi = (date: Date | string, endOfDay: boolean): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const time = endOfDay ? "23:59:59" : "00:00:00";
  return `${y}-${m}-${day}T${time}`;
};

/**
 * Converts a snake_case action code into a readable fallback label.
 */
export const humanizeAction = (action: string): string => {
  if (!action) return "Unknown";
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch: string) => ch.toUpperCase());
};

/** Audit timestamps are already in Arabia Standard Time from the API. Returns value or fallback. */
export const formatAuditTimestamp = (value?: string | null): string => {
  return value?.trim() ? value : "–";
};

/**
 * Groups logs by date. Timestamp is already AST display string (e.g. "12 Feb 2026, 5:30 PM"); use date part as key.
 */
export const groupLogsByDay = (logs: AuditLogEntry[]): Record<string, AuditLogEntry[]> => {
  return logs.reduce<Record<string, AuditLogEntry[]>>((acc, log) => {
    const key = log.timestamp?.split(",")[0]?.trim() ?? "unknown";
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
