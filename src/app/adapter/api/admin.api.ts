import apiClient from './client';
import type { AuditLogsApiParams } from '../../../features/activity/types/auditLogs.types';

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface DocumentType {
  id: number;
  name: string;
  code: string;
  department_id: number;
  department_name: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface DashboardStats {
  success: boolean;
  stats: {
    total_documents: number;
    my_documents: number;
    pending_ocr: number;
    pending_approvals: number;
    recent_uploads: number;
    unread_notifications?: number;
    by_department?: Array<{ department: string; count: number }>;
  };
}

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

export interface AuditLog {
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

export interface AdminUserRow {
  id: number;
  name: string;
  login: string;
  email?: string | null;
  role: 'employee' | 'manager' | 'admin';
  department_ids: number[];
  manager_department_ids: number[];
}

export const adminApi = {
  /**
   * Get all departments
   */
  getDepartments: async (): Promise<{ success: boolean; data: Department[] }> => {
    const response = await apiClient.post('/api/departments', {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
    });
    return response.data.result || response.data;
  },

  /**
   * Get document types
   */
  getDocumentTypes: async (department_id?: number): Promise<{ success: boolean; data: DocumentType[] }> => {
    const response = await apiClient.post('/api/document-types', {
      jsonrpc: '2.0',
      method: 'call',
      params: { department_id },
    });
    return response.data.result || response.data;
  },

  /**
   * Get all tags
   */
  getTags: async (): Promise<{ success: boolean; data: Tag[] }> => {
    const response = await apiClient.post('/api/tags', {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
    });
    return response.data.result || response.data;
  },

  /**
   * Get audit logs. Params: document_id, folder_id, action, date_from, date_to (YYYY-MM-DDTHH:mm:ss), page, per_page.
   */
  getAuditLogs: async (params?: AuditLogsApiParams): Promise<{
    success: boolean;
    data: AuditLog[];
    pagination: { total: number; page: number; per_page: number };
    error?: string;
  }> => {
    const response = await apiClient.post('/api/audit-logs', {
      jsonrpc: '2.0',
      method: 'call',
      params: params ?? {},
      id: 1,
    });
    return response.data.result || response.data;
  },

  /**
   * Get dashboard stats
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.post('/api/stats/dashboard', {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
    });
    return response.data.result || response.data;
  },

  /**
   * Get managers
   */
  getManagers: async (department_id?: number): Promise<{ success: boolean; data: AdminUserRow[] }> => {
    const response = await apiClient.post('/api/users/managers', {
      department_id,
    });
    return response.data;
  },
};
