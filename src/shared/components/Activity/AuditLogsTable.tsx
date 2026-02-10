import type { AuditLogEntry } from "./types";
import { formatAuditTimestamp, humanizeAction } from "./utils";
import { AuditActionBadge } from "./AuditActionBadge";
import "./activity.css";

export interface AuditLogsTableTranslator {
  (key: string, options?: { defaultValue?: string; [key: string]: unknown }): string;
}

export interface AuditLogsTableProps {
  logs: AuditLogEntry[];
  loading?: boolean;
  error?: string | null;
  t: AuditLogsTableTranslator;
  showDocument?: boolean;
  showMetadata?: boolean;
  onDocumentClick?: (documentId: number) => void;
}

/** Table view for audit logs. */
export const AuditLogsTable = ({
  logs,
  loading = false,
  error = null,
  t,
  showDocument = false,
  showMetadata = false,
  onDocumentClick,
}: AuditLogsTableProps) => {
  if (loading) {
    return <div className="text-muted small">{t("common.loading", { defaultValue: "Loading..." })}</div>;
  }

  if (error) {
    return <div className="alert alert-danger mb-0">{error}</div>;
  }

  return (
    <div className="table-responsive activity-table-wrap">
      <table className="table table-sm align-middle mb-0">
        <thead>
          <tr>
            <th>{t("activity.columns.action", { defaultValue: "Action" })}</th>
            <th>{t("activity.columns.user", { defaultValue: "User" })}</th>
            <th>{t("activity.columns.timestamp", { defaultValue: "Timestamp" })}</th>
            {showDocument && <th>{t("activity.columns.document", { defaultValue: "Document" })}</th>}
            {showMetadata && <th>{t("activity.columns.details", { defaultValue: "Details" })}</th>}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const actionLabel = t(`activity.actions.${log.action}`, { defaultValue: humanizeAction(String(log.action)) });
            return (
              <tr key={log.id}>
                <td>
                  <AuditActionBadge action={log.action} label={actionLabel} />
                </td>
                <td>{log.user_name || "–"}</td>
                <td>{formatAuditTimestamp(log.timestamp)}</td>
                {showDocument && (
                  <td>
                    {typeof log.document_id === "number" && onDocumentClick ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => onDocumentClick(log.document_id as number)}
                      >
                        {log.document_title || `#${log.document_id}`}
                      </button>
                    ) : (
                      <span>{log.document_title || "–"}</span>
                    )}
                  </td>
                )}
                {showMetadata && <td>{log.metadata || "–"}</td>}
              </tr>
            );
          })}
          {logs.length === 0 && (
            <tr>
              <td colSpan={showDocument && showMetadata ? 5 : showDocument || showMetadata ? 4 : 3} className="text-center text-muted">
                {t("activity.noData", { defaultValue: "No activity found." })}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
