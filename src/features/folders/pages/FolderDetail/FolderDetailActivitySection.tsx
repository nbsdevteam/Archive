import type { TFunction } from "i18next";
import type { ActivityViewMode } from "@/features/activity/types";
import { AuditActivityPanel } from "@/shared/components/Activity/AuditActivityPanel";
import type { AuditLogEntry } from "@/shared/components/Activity/types";

export interface FolderDetailActivitySectionProps {
  t: TFunction;
  logs: AuditLogEntry[] | unknown[];
  loading: boolean;
  error: string | null;
  viewMode: ActivityViewMode;
  onViewModeChange: (mode: ActivityViewMode) => void;
  documentCount: number;
  onRefresh: () => void;
  onDocumentClick: (documentId: number) => void;
}

/** Folder activity: AuditActivityPanel with timeline/tree and document click navigation. */
export function FolderDetailActivitySection({
  t,
  logs,
  loading,
  error,
  viewMode,
  onViewModeChange,
  documentCount,
  onRefresh,
  onDocumentClick,
}: FolderDetailActivitySectionProps) {
  return (
    <AuditActivityPanel
      t={t}
      logs={logs as AuditLogEntry[]}
      loading={loading}
      error={error}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      title={t("activity.folderTitle", { defaultValue: "Folder activity" })}
      subtitle={t("activity.folderCoverage", {
        defaultValue: "Showing events from {{count}} documents",
        count: documentCount,
      })}
      showRefresh
      onRefresh={onRefresh}
      showDocument
      onDocumentClick={onDocumentClick}
      treeGroupBy="document"
    />
  );
}
