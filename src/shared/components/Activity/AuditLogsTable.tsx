import { useCallback, useMemo } from "react";
import type { AuditLogEntry } from "./types";
import { formatAuditTimestamp, humanizeAction } from "./utils";
import { AuditActionBadge } from "./AuditActionBadge";
import { DataTable } from "@/shared/components/ui";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
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
  /** Navigates to document when document link is clicked; reads document id from data-document-id. */
  const handleDocumentLinkClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = e.currentTarget.dataset.documentId;
      if (id != null && onDocumentClick) onDocumentClick(Number(id));
    },
    [onDocumentClick]
  );

  const columns: ColumnDef<AuditLogEntry>[] = useMemo(() => {
    const base: ColumnDef<AuditLogEntry>[] = [
      {
        id: "action",
        header: t("activity.columns.action", { defaultValue: "Action" }),
        render: (log) => {
          const actionLabel = t(`activity.actions.${log.action}`, { defaultValue: humanizeAction(String(log.action)) });
          return <AuditActionBadge action={log.action} label={actionLabel} />;
        },
      },
      {
        id: "user",
        header: t("activity.columns.user", { defaultValue: "User" }),
        truncate: true,
        render: (log) => log.user_name || "–",
      },
      {
        id: "timestamp",
        header: t("activity.columns.timestamp", { defaultValue: "Timestamp" }),
        truncate: true,
        render: (log) => formatAuditTimestamp(log.timestamp),
      },
    ];

    if (showDocument) {
      base.push({
        id: "document",
        header: t("activity.columns.document", { defaultValue: "Document" }),
        render: (log) =>
          typeof log.document_id === "number" && onDocumentClick ? (
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              data-document-id={String(log.document_id)}
              onClick={handleDocumentLinkClick}
            >
              {log.document_title || `#${log.document_id}`}
            </button>
          ) : (
            <span>{log.document_title || "–"}</span>
          ),
      });
    }

    if (showMetadata) {
      base.push({
        id: "metadata",
        header: t("activity.columns.details", { defaultValue: "Details" }),
        truncate: true,
        render: (log) => log.metadata || "–",
      });
    }

    return base;
  }, [t, showDocument, showMetadata, handleDocumentLinkClick]);

  if (loading) {
    return <div className="text-muted small">{t("common.loading", { defaultValue: "Loading..." })}</div>;
  }

  if (error) {
    return <div className="alert alert-danger mb-0">{error}</div>;
  }

  return (
    <div className="activity-table-wrap">
      <DataTable<AuditLogEntry>
        data={logs}
        getRowId={(log) => log.id}
        columns={columns}
        emptyMessage={t("activity.noData", { defaultValue: "No activity found." })}
        tableClassName="table table-sm align-middle mb-0"
        responsive="table"
      />
    </div>
  );
};
