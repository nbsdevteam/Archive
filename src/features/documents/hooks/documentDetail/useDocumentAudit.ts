import { useState } from "react";
import { useAuditLogs } from "@/features/activity/hooks/useAuditLogs";
import type { ActivityViewMode } from "@/features/activity/types";

/**
 * Audit log for document detail and activity view mode.
 */
export function useDocumentAudit(docId: number | null, activeTab: string) {
  const [activityViewMode, setActivityViewMode] = useState<ActivityViewMode>("timeline");

  const {
    logs: auditLogs,
    loading: loadingAudit,
    error: auditError,
    refresh: auditRefresh,
  } = useAuditLogs({
    enabled: Boolean(docId && activeTab === "audit"),
    initialParams: {
      document_id: docId ?? undefined,
      page: 1,
      per_page: 50,
    },
  });

  return {
    auditLogs,
    loadingAudit,
    auditError,
    auditRefresh,
    activityViewMode,
    setActivityViewMode,
  };
}
