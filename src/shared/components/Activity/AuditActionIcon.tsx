import { InfoWrapper } from "../ui";
import { getAuditActionVisual, type AuditActionColor } from "../../utils/auditActionVisuals";

interface AuditActionIconProps {
  /** Audit action code (e.g. upload, document_soft_deleted). */
  action: string;
  /** Full action label shown in the tooltip on hover. */
  label: string;
  /** Optional class for the wrapper (e.g. for table cell alignment). */
  className?: string;
}

/** Maps audit action color intent to Bootstrap badge utility classes. */
function getBadgeClassFromColor(color: AuditActionColor): string {
  const map: Record<AuditActionColor, string> = {
    primary: "badge bg-primary-subtle text-primary",
    secondary: "badge bg-secondary-subtle text-secondary",
    success: "badge bg-success-subtle text-success",
    warning: "badge bg-warning-subtle text-warning",
    error: "badge bg-danger-subtle text-danger",
    info: "badge bg-info-subtle text-info",
  };
  return map[color] ?? "badge bg-secondary-subtle text-secondary";
}

/**
 * Renders an icon-only representation of an audit action. On hover, the theme-styled
 * InfoWrapper popover (with arrow) shows the full action label.
 */
export function AuditActionIcon({ action, label, className = "" }: AuditActionIconProps) {
  const { Icon, color } = getAuditActionVisual(String(action || "unknown"));
  const badgeClass = getBadgeClassFromColor(color);

  const trigger = (
    <span className={`d-inline-flex align-items-center justify-content-center ${badgeClass}`} aria-hidden>
      <Icon size={16} strokeWidth={2} />
    </span>
  );

  return (
    <InfoWrapper
      content={label}
      position="top"
      trigger={trigger}
      className={className}
      showOn="hover"
    />
  );
}
