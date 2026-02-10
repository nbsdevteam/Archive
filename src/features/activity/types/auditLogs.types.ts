/**
 * Audit logs types used by the activity feature.
 * These are aligned to the backend schema provided by BE.
 */
export type AuditAction =
  | "upload"
  | "view"
  | "download"
  | "edit_request"
  | "edit_request_created"
  | "edit_request_approved"
  | "edit_request_rejected"
  | "approval"
  | "rejection"
  | "new_version"
  | "new_version_uploaded"
  | "archive"
  | "unarchive"
  | "document_soft_deleted"
  | "document_restored"
  | "document_permanently_deleted"
  | "search"
  | "login"
  | "logout"
  | "attachment_upload"
  | "attachment_updated"
  | "attachment_deleted"
  | "attachment_restored"
  | "attachment_permanently_deleted"
  | "multiple_attachments_upload"
  | "signed_version_uploaded"
  | "relation_created"
  | "folder_created"
  | "folder_updated"
  | "folder_deleted"
  | "folder_moved"
  | "department_created"
  | "department_updated"
  | "department_archived"
  | "document_type_created"
  | "document_type_updated"
  | "document_type_archived";

/**
 * Canonical audit action list used by timeline visibility filters and labels.
 */
export const AUDIT_ACTION_OPTIONS: AuditAction[] = [
  "upload",
  "view",
  "download",
  "edit_request",
  "edit_request_created",
  "edit_request_approved",
  "edit_request_rejected",
  "approval",
  "rejection",
  "new_version",
  "new_version_uploaded",
  "archive",
  "unarchive",
  "document_soft_deleted",
  "document_restored",
  "document_permanently_deleted",
  "search",
  "login",
  "logout",
  "attachment_upload",
  "attachment_updated",
  "attachment_deleted",
  "attachment_restored",
  "attachment_permanently_deleted",
  "multiple_attachments_upload",
  "signed_version_uploaded",
  "relation_created",
  "folder_created",
  "folder_updated",
  "folder_deleted",
  "folder_moved",
  "department_created",
  "department_updated",
  "department_archived",
  "document_type_created",
  "document_type_updated",
  "document_type_archived",
];

export type ActivityViewMode = "table" | "timeline" | "tree";

export interface AuditLogEntry {
  id: number;
  user_id: number;
  user_name: string;
  action: AuditAction | string;
  document_id: number | null;
  document_title: string | null;
  department_id: number | null;
  department_name: string | null;
  timestamp: string;
  ip_address: string | null;
  metadata: string | null;
}

export interface AuditPagination {
  total: number;
  page: number;
  per_page: number;
}

export interface AuditLogsQueryParams {
  document_id?: number;
  action?: AuditAction | string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface AuditLogsResult {
  success: boolean;
  data: AuditLogEntry[];
  pagination?: AuditPagination;
  error?: string;
}
