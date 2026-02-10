import { memo } from "react";
import { Button } from "../ui";
import type { ActivityViewMode } from "./types";
import type { AuditLogEntry } from "./types";
import { ActivityViewSwitcher } from "./ActivityViewSwitcher";
import { AuditLogsTable } from "./AuditLogsTable";
import { AuditLogsTimeline } from "./AuditLogsTimeline";
import { AuditLogsTreeView } from "./AuditLogsTreeView";

export interface AuditActivityPanelTranslator {
  (key: string, options?: { defaultValue?: string; [key: string]: unknown }): string;
}

export interface AuditActivityPanelProps {
  /** Audit log entries to display. */
  logs: AuditLogEntry[];
  loading?: boolean;
  error?: string | null;
  /** Current view mode (table | timeline | tree). */
  viewMode: ActivityViewMode;
  /** Called when user switches view. */
  onViewModeChange: (mode: ActivityViewMode) => void;
  /** Panel title (e.g. "Folder activity"). */
  title: string;
  /** Optional subtitle or coverage text. */
  subtitle?: React.ReactNode;
  /** Show refresh button in header. */
  showRefresh?: boolean;
  /** Called when refresh is clicked. */
  onRefresh?: () => void;
  /** Show document column in table; enable document link in timeline. */
  showDocument?: boolean;
  /** Show metadata/details column. */
  showMetadata?: boolean;
  /** Navigate to document (table: documentId; timeline: documentId, log). */
  onDocumentClick?: (documentId: number, log?: AuditLogEntry) => void;
  /** Tree view group by: "document" | "action". */
  treeGroupBy?: "document" | "action";
  /** i18n translate function. */
  t: AuditActivityPanelTranslator;
  /** Optional class for the card wrapper. */
  className?: string;
}

/**
 * Generic audit activity panel: card with title, optional subtitle/refresh, view switcher,
 * and table/timeline/tree content. Pure component; only rerenders when props change.
 */
const AuditActivityPanelComponent = ({
  logs,
  loading = false,
  error = null,
  viewMode,
  onViewModeChange,
  title,
  subtitle,
  showRefresh = false,
  onRefresh,
  showDocument = false,
  showMetadata = false,
  onDocumentClick,
  treeGroupBy = "document",
  t,
  className,
}: AuditActivityPanelProps) => {
  return (
    <div className={className ? `card mb-3 ${className}` : "card mb-3"}>
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <h6 className="mb-0">🕒 {title}</h6>
        <div className="d-flex align-items-center gap-2">
          {subtitle != null && <small className="text-muted">{subtitle}</small>}
          {showRefresh && onRefresh && (
            <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={onRefresh}>
              {t("common.refresh", { defaultValue: "Refresh" })}
            </Button>
          )}
          <ActivityViewSwitcher t={t} value={viewMode} onChange={onViewModeChange} />
        </div>
      </div>
      <div className="card-body">
        {viewMode === "table" && (
          <AuditLogsTable
            t={t}
            logs={logs}
            loading={loading}
            error={error}
            showDocument={showDocument}
            showMetadata={showMetadata}
            onDocumentClick={onDocumentClick ? (id) => onDocumentClick(id) : undefined}
          />
        )}
        {viewMode === "timeline" && (
          <AuditLogsTimeline
            t={t}
            logs={logs}
            loading={loading}
            error={error}
            showDocument={showDocument}
            showMetadata={showMetadata}
            onDocumentClick={onDocumentClick ? (id, log) => onDocumentClick(id, log) : undefined}
          />
        )}
        {viewMode === "tree" && (
          <AuditLogsTreeView t={t} logs={logs} loading={loading} error={error} groupBy={treeGroupBy} />
        )}
      </div>
    </div>
  );
};

function arePropsEqual(prev: AuditActivityPanelProps, next: AuditActivityPanelProps): boolean {
  if (
    prev.logs !== next.logs ||
    prev.loading !== next.loading ||
    prev.error !== next.error ||
    prev.viewMode !== next.viewMode ||
    prev.title !== next.title ||
    prev.subtitle !== next.subtitle ||
    prev.showRefresh !== next.showRefresh ||
    prev.showDocument !== next.showDocument ||
    prev.showMetadata !== next.showMetadata ||
    prev.treeGroupBy !== next.treeGroupBy ||
    prev.t !== next.t ||
    prev.className !== next.className
  ) {
    return false;
  }
  if (prev.onViewModeChange !== next.onViewModeChange) return false;
  if (prev.onRefresh !== next.onRefresh) return false;
  if (prev.onDocumentClick !== next.onDocumentClick) return false;
  return true;
}

export const AuditActivityPanel = memo(AuditActivityPanelComponent, arePropsEqual);
