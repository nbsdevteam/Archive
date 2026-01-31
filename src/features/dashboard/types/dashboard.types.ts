/**
 * Dashboard feature types
 * Based on API_DOCUMENTATION.md
 */

export interface DashboardStats {
  total_documents?: number;
  total_folders?: number;
  archived_documents?: number;
  active_documents?: number;
  storage_used?: string;
  recent_uploads?: number;
  pending_approvals?: number;
  [key: string]: unknown;
}

export interface DashboardActivity {
  id?: number;
  action: string;
  item: string;
  when: string;
  user?: string;
  type?: "document" | "folder" | "user" | "system";
}

export interface DashboardResponse {
  success: boolean;
  data?: DashboardStats;
  stats?: DashboardStats;
  error?: string;
}
