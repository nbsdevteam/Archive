import { memo, useCallback, useMemo, useState } from "react";
import { Button, Checkbox, Modal, ModalFooter } from "../ui";
import { getAuditActionVisual } from "../../utils/auditActionVisuals";
import type { AuditLogEntry } from "./types";
import type { AuditActionColor } from "../../utils/auditActionVisuals";
import { AUDIT_ACTION_OPTIONS } from "./types";
import { useActivityTimelineFilterStore } from "./useActivityTimelineFilterStore";
import { formatAuditTimestamp, groupLogsByDay, humanizeAction } from "./utils";
import "./activity.css";

/** Maps MUI-style color names to hex for the custom timeline dot (no MUI). */
const ACTION_COLOR_HEX: Record<AuditActionColor, string> = {
  primary: "#1976d2",
  secondary: "#9e9e9e",
  success: "#2e7d32",
  warning: "#ed6c02",
  error: "#d32f2f",
  info: "#0288d1",
};

/** Returns an onChange handler for the action filter checkbox. */
function getActionVisibilityChangeHandler(
  action: string,
  toggleActionVisibility: (action: string, visible: boolean) => void,
) {
  return function handleActionVisibilityChange(checked: boolean) {
    toggleActionVisibility(action, checked);
  };
}

export interface AuditLogsTimelineTranslator {
  (
    key: string,
    options?: { defaultValue?: string; [key: string]: unknown },
  ): string;
}

export interface AuditLogsTimelineProps {
  logs: AuditLogEntry[];
  loading?: boolean;
  error?: string | null;
  t: AuditLogsTimelineTranslator;
  showDocument?: boolean;
  showMetadata?: boolean;
  onDocumentClick?: (documentId: number, log: AuditLogEntry) => void;
  className?: string;
}

/** Single timeline item for the custom (no-MUI) timeline. */
function TimelineItemRow({
  log,
  actionLabel,
  visual,
  isLast,
  showDocument,
  showMetadata,
  isDocumentClickable,
  documentClickHandler,
  t,
}: {
  log: AuditLogEntry;
  actionLabel: string;
  visual: ReturnType<typeof getAuditActionVisual>;
  isLast: boolean;
  showDocument: boolean;
  showMetadata: boolean;
  isDocumentClickable: boolean;
  documentClickHandler: (() => void) | undefined;
  t: AuditLogsTimelineTranslator;
}) {
  const DotIcon = visual.Icon;
  const viewLabel = t("common.view", { defaultValue: "View" });
  return (
    <div
      className="activity-timeline-item"
      style={{ display: "flex", gap: 0, alignItems: "flex-start" }}
    >
      {/* Left side: timestamp — takes ~45% so the connector sits near the center */}
      <div
        className="activity-timeline-opposite activity-timeline-time"
        style={{
          flex: "0 0 45%",
          fontSize: 12,
          textAlign: "right",
          paddingRight: 12,
          paddingTop: 4,
          minWidth: 0,
        }}
      >
        {formatAuditTimestamp(log.timestamp)}
      </div>
      {/* Center connector: dot + vertical line — alignSelf stretch lets the line grow to match the card height */}
      <div
        style={{
          flexShrink: 0,
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 28,
          marginTop: 2,
        }}
      >
        {/* Outlined dot: white background + colored border + colored icon, matching production MUI TimelineDot variant="outlined" */}
        <div
          className="activity-timeline-dot"
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: `2px solid ${ACTION_COLOR_HEX[visual.color] ?? "#1976d2"}`,
            color: ACTION_COLOR_HEX[visual.color] ?? "#1976d2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <DotIcon size={16} strokeWidth={2} />
        </div>
        {!isLast && (
          <div
            className="activity-timeline-line"
            style={{
              width: 2,
              flex: 1,
              minHeight: 24,
              marginBlock: 8,
            }}
          />
        )}
      </div>
      {/* Right side: content — takes remaining ~55% */}
      <div style={{ flex: 1, padding: "0 0 16px 12px", minWidth: 0 }}>
        <div
          className="activity-timeline-label-grid activity-timeline-card"
          style={{
            padding: 12,
            borderRadius: 8,
          }}
        >
          <div className="activity-timeline-label-row small text-secondary">
            <span className="activity-timeline-label-key">
              {t("activity.columns.action", { defaultValue: "Action" })}:
            </span>{" "}
            <span className="activity-timeline-label-value">{actionLabel}</span>
          </div>
          <div className="activity-timeline-label-row small text-secondary">
            <span className="activity-timeline-label-key">
              {t("activity.columns.user", { defaultValue: "User" })}:
            </span>{" "}
            <span className="activity-timeline-label-value">
              {log.user_name || "–"}
            </span>
          </div>
          <div className="activity-timeline-label-row small text-secondary">
            <span className="activity-timeline-label-key">
              {t("activity.columns.document", { defaultValue: "Document" })}:
            </span>{" "}
            {showDocument && isDocumentClickable ? (
              <span title={viewLabel}>
                <button
                  type="button"
                  className="activity-timeline-doc-button"
                  onClick={documentClickHandler}
                >
                  {log.document_title || `#${log.document_id}`}
                </button>
              </span>
            ) : (
              <span className="activity-timeline-label-value">
                {log.document_title ||
                  t("activity.noDocument", {
                    defaultValue: "No related document",
                  })}
              </span>
            )}
          </div>
          {showMetadata && log.metadata && (
            <div className="small text-muted mt-1">{log.metadata}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Timeline view for audit logs; no MUI deps so mui-vendor is not pulled on activity route. */
const AuditLogsTimelineComponent = ({
  logs,
  loading = false,
  error = null,
  t,
  showDocument = true,
  showMetadata = true,
  onDocumentClick,
  className,
}: AuditLogsTimelineProps) => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const hiddenActions = useActivityTimelineFilterStore(
    (state) => state.hiddenActions,
  );
  const toggleActionVisibility = useActivityTimelineFilterStore(
    (state) => state.toggleActionVisibility,
  );
  const showAllActions = useActivityTimelineFilterStore(
    (state) => state.showAllActions,
  );

  const hiddenActionSet = useMemo(
    () => new Set(hiddenActions),
    [hiddenActions],
  );
  const actionEventCounts = useMemo(() => {
    return logs.reduce<Record<string, number>>((acc, log) => {
      acc[String(log.action)] = (acc[String(log.action)] ?? 0) + 1;
      return acc;
    }, {});
  }, [logs]);
  const availableActions = useMemo(() => {
    const actionSet = new Set<string>(
      AUDIT_ACTION_OPTIONS.map((a) => String(a)),
    );
    logs.forEach((log) => actionSet.add(String(log.action)));
    return [...actionSet].sort((left, right) => {
      const leftHidden = hiddenActionSet.has(left) ? 0 : 1;
      const rightHidden = hiddenActionSet.has(right) ? 0 : 1;
      if (leftHidden !== rightHidden) return leftHidden - rightHidden;
      const leftLabel = t(`activity.actions.${left}`, {
        defaultValue: humanizeAction(left),
      });
      const rightLabel = t(`activity.actions.${right}`, {
        defaultValue: humanizeAction(right),
      });
      return leftLabel.localeCompare(rightLabel);
    });
  }, [hiddenActionSet, logs, t]);
  const filteredLogs = useMemo(
    () => logs.filter((log) => !hiddenActionSet.has(String(log.action))),
    [logs, hiddenActionSet],
  );
  const groups = useMemo(() => groupLogsByDay(filteredLogs), [filteredLogs]);
  const dayKeys = useMemo(
    () => Object.keys(groups).sort((a, b) => (a < b ? 1 : -1)),
    [groups],
  );
  const handleDocumentClick = useCallback(
    (documentId: number, log: AuditLogEntry) =>
      onDocumentClick?.(documentId, log),
    [onDocumentClick],
  );
  const documentClickHandlers = useMemo(() => {
    const map = new Map<number, () => void>();
    filteredLogs.forEach((log) => {
      if (typeof log.document_id === "number") {
        map.set(log.id, () =>
          handleDocumentClick(log.document_id as number, log),
        );
      }
    });
    return map;
  }, [filteredLogs, handleDocumentClick]);
  const openFilterModal = useCallback(() => setIsFilterModalOpen(true), []);
  const closeFilterModal = useCallback(() => setIsFilterModalOpen(false), []);

  if (loading)
    return (
      <div className="text-muted small">
        {t("common.loading", { defaultValue: "Loading..." })}
      </div>
    );
  if (error) return <div className="alert alert-danger mb-0">{error}</div>;
  if (logs.length === 0)
    return (
      <p className="text-muted mb-0">
        {t("activity.noData", { defaultValue: "No activity found." })}
      </p>
    );

  return (
    <div className={`activity-timeline ${className ?? ""}`}>
      <div className="d-flex justify-content-end mb-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="btn-outline-secondary"
          onClick={openFilterModal}
        >
          {t("activity.timeline.showActivities", {
            defaultValue: "Show activities",
          })}
        </Button>
      </div>
      {filteredLogs.length === 0 && (
        <div className="alert alert-info d-flex align-items-center justify-content-between gap-2">
          <span>
            {t("activity.timeline.noVisibleActivities", {
              defaultValue: "No activities are visible with current filters.",
            })}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="btn-outline-secondary"
            onClick={showAllActions}
          >
            {t("activity.timeline.showAll", { defaultValue: "Show all" })}
          </Button>
        </div>
      )}
      {dayKeys.map((dayKey) => (
        <section className="activity-timeline-day" key={dayKey}>
          <h6
            className="activity-timeline-day-title small fw-semibold text-secondary mb-2"
            style={{ fontSize: "0.875rem" }}
          >
            {dayKey === "unknown"
              ? t("activity.unknownDay", { defaultValue: "Unknown day" })
              : dayKey}
          </h6>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(groups[dayKey] || []).map((log, index) => {
              const actionLabel = t(`activity.actions.${log.action}`, {
                defaultValue: humanizeAction(String(log.action)),
              });
              const visual = getAuditActionVisual(String(log.action));
              const isLast = index === (groups[dayKey]?.length ?? 0) - 1;
              const isDocumentClickable = Boolean(
                onDocumentClick && typeof log.document_id === "number",
              );
              const documentClickHandler = documentClickHandlers.get(log.id);
              return (
                <TimelineItemRow
                  key={log.id}
                  log={log}
                  actionLabel={actionLabel}
                  visual={visual}
                  isLast={isLast}
                  showDocument={showDocument}
                  showMetadata={showMetadata}
                  isDocumentClickable={isDocumentClickable}
                  documentClickHandler={documentClickHandler}
                  t={t}
                />
              );
            })}
          </div>
        </section>
      ))}

      <Modal
        isOpen={isFilterModalOpen}
        onClose={closeFilterModal}
        title={t("activity.timeline.showActivities", {
          defaultValue: "Show activities",
        })}
        size="md"
      >
        <p className="text-muted small mb-2">
          {t("activity.timeline.filterHint", {
            defaultValue:
              "Select which activity types should appear in timeline view.",
          })}
        </p>
        <div className="activity-timeline-filter-list">
          {availableActions.map((action) => {
            const isVisible = !hiddenActionSet.has(action);
            const actionLabel = t(`activity.actions.${action}`, {
              defaultValue: humanizeAction(action),
            });
            const actionCount = actionEventCounts[action] ?? 0;
            return (
              <Checkbox
                key={action}
                id={`activity-action-${action}`}
                label={actionLabel}
                description={t("activity.timeline.eventCount", {
                  defaultValue: "{{count}} events",
                  count: actionCount,
                })}
                checked={isVisible}
                onChange={getActionVisibilityChangeHandler(
                  action,
                  toggleActionVisibility,
                )}
                className="activity-timeline-filter-item"
              />
            );
          })}
        </div>
        <ModalFooter className="d-flex justify-content-between flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="btn-outline-secondary"
            onClick={showAllActions}
          >
            {t("activity.timeline.showAll", { defaultValue: "Show all" })}
          </Button>
          <Button type="button" variant="secondary" onClick={closeFilterModal}>
            {t("common.save", { defaultValue: "Save" })}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

const arePropsEqual = (
  prev: AuditLogsTimelineProps,
  next: AuditLogsTimelineProps,
) =>
  prev.logs === next.logs &&
  prev.loading === next.loading &&
  prev.error === next.error &&
  prev.t === next.t &&
  prev.showDocument === next.showDocument &&
  prev.showMetadata === next.showMetadata &&
  prev.onDocumentClick === next.onDocumentClick &&
  prev.className === next.className;

const AuditLogsTimeline = memo(AuditLogsTimelineComponent, arePropsEqual);
export default AuditLogsTimeline;
