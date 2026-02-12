import type { AuditLogEntry } from "./types";
import { formatApiTimestampInIraqi } from "../../utils/format/date";

/** Converts a snake_case action code into a readable fallback label. */
export const humanizeAction = (action: string): string => {
  if (!action) return "Unknown";
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch: string) => ch.toUpperCase());
};

/** Formats an audit timestamp (API UTC) to Iraqi time for table, timeline and tree views. */
export const formatAuditTimestamp = (value?: string | null): string => {
  return formatApiTimestampInIraqi(value);
};

/** Groups logs by the local date key (YYYY-MM-DD). */
export const groupLogsByDay = (logs: AuditLogEntry[]): Record<string, AuditLogEntry[]> => {
  return logs.reduce<Record<string, AuditLogEntry[]>>((acc, log) => {
    const date = new Date(log.timestamp);
    const key = Number.isNaN(date.getTime()) ? "unknown" : date.toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});
};

/** Groups logs for the tree view by document or by action. */
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
