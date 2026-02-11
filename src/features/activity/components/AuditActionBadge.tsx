import type { AuditLogEntry } from "../types/auditLogs.types";
import { AuditActionIcon } from "../../../shared/components/Activity";

interface AuditActionBadgeProps {
  action: AuditLogEntry["action"];
  label: string;
}

/**
 * Renders an icon-only action badge; full action name is shown on hover via InfoWrapper tooltip.
 */
export const AuditActionBadge = ({ action, label }: AuditActionBadgeProps) => {
  return <AuditActionIcon action={String(action || "unknown")} label={label} />;
};
