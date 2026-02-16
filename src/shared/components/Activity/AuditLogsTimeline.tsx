import { memo, useCallback, useMemo, useState } from "react";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
 import Tooltip from "@mui/material/Tooltip";
import { Button, Checkbox, Modal, ModalFooter } from "../ui";
 import { getAuditActionVisual } from "../../utils/auditActionVisuals";
import type { AuditLogEntry } from "./types";
import { AUDIT_ACTION_OPTIONS } from "./types";
import { useActivityTimelineFilterStore } from "./useActivityTimelineFilterStore";
import { formatAuditTimestamp, groupLogsByDay, humanizeAction } from "./utils";
import "./activity.css";

/** Returns an onChange handler for the action filter checkbox. */
function getActionVisibilityChangeHandler(
  action: string,
  toggleActionVisibility: (action: string, visible: boolean) => void
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

/** Timeline view for audit logs; memoized to avoid rerenders when props are unchanged. */
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
          <Typography
            variant="subtitle2"
            className="activity-timeline-day-title"
          >
            {dayKey === "unknown"
              ? t("activity.unknownDay", { defaultValue: "Unknown day" })
              : dayKey}
          </Typography>
          <Timeline position="right" sx={{ m: 0, p: 0 }}>
            {(groups[dayKey] || []).map((log, index) => {
              const actionLabel = t(`activity.actions.${log.action}`, {
                defaultValue: humanizeAction(String(log.action)),
              });
              const visual = getAuditActionVisual(String(log.action));
              const DotIcon = visual.Icon;
              const isLast = index === (groups[dayKey]?.length ?? 0) - 1;
              const isDocumentClickable = Boolean(
                onDocumentClick && typeof log.document_id === "number",
              );
              const documentClickHandler = documentClickHandlers.get(log.id);

              return (
                <TimelineItem key={log.id} className="activity-timeline-item">
                  <TimelineOppositeContent className="activity-timeline-opposite">
                    <Typography variant="caption" color="text.secondary">
                      {formatAuditTimestamp(log.timestamp)}
                    </Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={visual.color} variant="outlined">
                      <DotIcon size={16} strokeWidth={2} />
                    </TimelineDot>
                    {!isLast && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: 0.5, px: 2, mt: "4px" }}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 1.5 }}>
                      <div className="activity-timeline-label-grid">
                        <Typography
                          variant="body2"
                          className="activity-timeline-label-row"
                        >
                          <span className="activity-timeline-label-key">
                            {t("activity.columns.action", {
                              defaultValue: "Action",
                            })}
                            :
                          </span>{" "}
                          <span className="activity-timeline-label-value">
                            {actionLabel}
                          </span>
                        </Typography>
                        <Typography
                          variant="body2"
                          className="activity-timeline-label-row"
                        >
                          <span className="activity-timeline-label-key">
                            {t("activity.columns.user", {
                              defaultValue: "User",
                            })}
                            :
                          </span>{" "}
                          <span className="activity-timeline-label-value">
                            {log.user_name || "–"}
                          </span>
                        </Typography>
                        <Typography
                          variant="body2"
                          className="activity-timeline-label-row"
                        >
                          <span className="activity-timeline-label-key">
                            {t("activity.columns.document", {
                              defaultValue: "Document",
                            })}
                            :
                          </span>{" "}
                          {showDocument && isDocumentClickable ? (
                            <Tooltip
                              title={t("common.view", { defaultValue: "View" })}
                            >
                              <button
                                type="button"
                                className="activity-timeline-doc-button"
                                onClick={documentClickHandler}
                              >
                                {log.document_title || `#${log.document_id}`}
                              </button>
                            </Tooltip>
                          ) : (
                            <span className="activity-timeline-label-value">
                              {log.document_title ||
                                t("activity.noDocument", {
                                  defaultValue: "No related document",
                                })}
                            </span>
                          )}
                        </Typography>
                      </div>
                      {showMetadata && log.metadata && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mt={1}
                        >
                          {log.metadata}
                        </Typography>
                      )}
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
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
                onChange={getActionVisibilityChangeHandler(action, toggleActionVisibility)}
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

export const AuditLogsTimeline = memo(
  AuditLogsTimelineComponent,
  arePropsEqual,
);
