import { memo, useCallback, useMemo } from "react";
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
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import RestoreFromTrashRoundedIcon from "@mui/icons-material/RestoreFromTrashRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import type { AuditLogEntry } from "../types/auditLogs.types";
import { formatAuditTimestamp, groupLogsByDay, humanizeAction } from "../utils/activity.utils";

interface Translator {
  (key: string, options?: { defaultValue?: string; [key: string]: unknown }): string;
}

interface AuditLogsTimelineProps {
  logs: AuditLogEntry[];
  loading?: boolean;
  error?: string | null;
  t: Translator;
  showDocument?: boolean;
  showMetadata?: boolean;
  onDocumentClick?: (documentId: number, log: AuditLogEntry) => void;
  className?: string;
}

/**
 * Returns icon and color variant for each action type.
 */
const getActionVisual = (
  action: string
): { icon: SvgIconComponent; color: "primary" | "secondary" | "success" | "warning" | "error" | "info" } => {
  if (action.includes("upload") || action.includes("new_version")) {
    return { icon: UploadFileRoundedIcon, color: "success" };
  }
  if (action.includes("download")) {
    return { icon: DownloadRoundedIcon, color: "info" };
  }
  if (action.includes("archive")) {
    return { icon: ArchiveRoundedIcon, color: "warning" };
  }
  if (action.includes("restored")) {
    return { icon: RestoreFromTrashRoundedIcon, color: "success" };
  }
  if (action.includes("deleted") || action.includes("rejection")) {
    return { icon: DeleteForeverRoundedIcon, color: "error" };
  }
  if (action.includes("folder_")) {
    return { icon: FolderRoundedIcon, color: "secondary" };
  }
  if (action.includes("edit") || action.includes("approval")) {
    return { icon: EditNoteRoundedIcon, color: "primary" };
  }
  if (action.includes("view") || action.includes("search")) {
    return { icon: VisibilityRoundedIcon, color: "info" };
  }
  return { icon: DescriptionRoundedIcon, color: "primary" };
};

/**
 * Timeline renderer for phase 2 while reusing the same audit log dataset.
 * This component is memoized to avoid rerendering when props are unchanged.
 */
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
  if (loading) {
    return <div className="text-muted small">{t("common.loading", { defaultValue: "Loading..." })}</div>;
  }

  if (error) {
    return <div className="alert alert-danger mb-0">{error}</div>;
  }

  const groups = useMemo(() => groupLogsByDay(logs), [logs]);
  const dayKeys = useMemo(
    () => Object.keys(groups).sort((left, right) => (left < right ? 1 : -1)),
    [groups]
  );
  const handleDocumentClick = useCallback(
    (documentId: number, log: AuditLogEntry) => {
      if (!onDocumentClick) return;
      onDocumentClick(documentId, log);
    },
    [onDocumentClick]
  );
  const documentClickHandlers = useMemo(() => {
    const handlers = new Map<number, () => void>();
    logs.forEach((log) => {
      if (typeof log.document_id !== "number") return;
      handlers.set(log.id, () => {
        handleDocumentClick(log.document_id as number, log);
      });
    });
    return handlers;
  }, [handleDocumentClick, logs]);

  if (logs.length === 0) {
    return <p className="text-muted mb-0">{t("activity.noData", { defaultValue: "No activity found." })}</p>;
  }

  return (
    <div className={`activity-timeline ${className ?? ""}`}>
      {dayKeys.map((dayKey) => (
        <section className="activity-timeline-day" key={dayKey}>
          <Typography variant="subtitle2" className="activity-timeline-day-title">
            {dayKey === "unknown" ? t("activity.unknownDay", { defaultValue: "Unknown day" }) : dayKey}
          </Typography>
          <Timeline position="right" sx={{ m: 0, p: 0 }}>
            {(groups[dayKey] || []).map((log, index) => {
              const actionLabel = t(`activity.actions.${log.action}`, {
                defaultValue: humanizeAction(String(log.action)),
              });
              const visual = getActionVisual(String(log.action));
              const DotIcon = visual.icon;
              const isLast = index === (groups[dayKey]?.length ?? 0) - 1;
              const isDocumentClickable = Boolean(onDocumentClick && typeof log.document_id === "number");
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
                      <DotIcon fontSize="small" />
                    </TimelineDot>
                    {!isLast && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: 0.5, px: 2 }}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip size="small" color={visual.color} label={actionLabel} />
                        <Typography variant="body2" fontWeight={600}>
                          {log.user_name || "–"}
                        </Typography>
                      </Stack>

                      {showDocument && (
                        <Box mt={1}>
                          {isDocumentClickable ? (
                            <Tooltip title={t("common.view", { defaultValue: "View" })}>
                              <button
                                type="button"
                                className="activity-timeline-doc-button"
                                onClick={documentClickHandler}
                              >
                                {log.document_title || `#${log.document_id}`}
                              </button>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {log.document_title || t("activity.noDocument", { defaultValue: "No related document" })}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {showMetadata && log.metadata && (
                        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
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
    </div>
  );
};

const arePropsEqual = (prev: AuditLogsTimelineProps, next: AuditLogsTimelineProps) => {
  return (
    prev.logs === next.logs &&
    prev.loading === next.loading &&
    prev.error === next.error &&
    prev.t === next.t &&
    prev.showDocument === next.showDocument &&
    prev.showMetadata === next.showMetadata &&
    prev.onDocumentClick === next.onDocumentClick &&
    prev.className === next.className
  );
};

const AuditLogsTimeline = memo(AuditLogsTimelineComponent, arePropsEqual);
export { AuditLogsTimeline };
export default AuditLogsTimeline;
