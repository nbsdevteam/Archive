/**
 * Neutral audit log API types used by adapter (admin.api) and activity feature.
 * Single source of truth to avoid adapter importing from features/activity.
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

/** Params sent in the /api/audit-logs JSON-RPC request. date_from/date_to use YYYY-MM-DDTHH:mm:ss. */
export interface AuditLogsApiParams {
  document_id?: number;
  folder_id?: number;
  action?: AuditAction | string;
  /** Start of day, e.g. "2025-01-01T00:00:00" */
  date_from?: string;
  /** End of day, e.g. "2025-02-11T23:59:59" */
  date_to?: string;
  page?: number;
  per_page?: number;
}
