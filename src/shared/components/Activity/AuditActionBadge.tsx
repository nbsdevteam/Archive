import type { AuditLogEntry } from "./types";
import { humanizeAction } from "./utils";

interface AuditActionBadgeProps {
  action: AuditLogEntry["action"];
  label: string;
}

/** Centralized action badge styling for table/timeline/tree. */
const getActionBadgeClassName = (action: string): string => {
  if (action.includes("delete") || action.includes("rejection")) return "badge bg-danger-subtle text-danger";
  if (action.includes("archive") || action.includes("trash")) return "badge bg-warning-subtle text-warning";
  if (action.includes("upload") || action.includes("create")) return "badge bg-success-subtle text-success";
  if (action.includes("update") || action.includes("edit")) return "badge bg-info-subtle text-info";
  return "badge bg-secondary-subtle text-secondary";
};

export const AuditActionBadge = ({ action, label }: AuditActionBadgeProps) => {
  const safeAction = String(action || "unknown");
  return (
    <span className={getActionBadgeClassName(safeAction)} title={humanizeAction(safeAction)}>
      {label}
    </span>
  );
};
