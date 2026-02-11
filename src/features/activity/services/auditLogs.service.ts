import { adminApi } from "../../../app/adapter/api/admin.api";
import type { AuditLogEntry, AuditLogsQueryParams, AuditLogsResult } from "../types/auditLogs.types";

/**
 * Normalizes nullable audit log fields so UI code can rely on stable types.
 */
const normalizeAuditLog = (log: Partial<AuditLogEntry>): AuditLogEntry => {
  return {
    id: Number(log.id ?? 0),
    user_id: Number(log.user_id ?? 0),
    user_name: String(log.user_name ?? ""),
    action: String(log.action ?? "view"),
    document_id: log.document_id ?? null,
    document_title: log.document_title ?? null,
    department_id: log.department_id ?? null,
    department_name: log.department_name ?? null,
    timestamp: String(log.timestamp ?? ""),
    ip_address: log.ip_address ?? null,
    metadata: log.metadata ?? null,
  };
};

/**
 * Fetches audit logs from backend and returns normalized entries.
 */
export const getAuditLogs = async (params: AuditLogsQueryParams = {}): Promise<AuditLogsResult> => {
  const response = await adminApi.getAuditLogs(params);
  const data = Array.isArray(response.data) ? response.data.map((log) => normalizeAuditLog(log)) : [];
  return {
    success: response.success,
    data,
    pagination: response.pagination,
    error: response.error,
  };
};
