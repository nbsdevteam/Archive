/**
 * Folders feature types
 * Based on API_DOCUMENTATION.md and legacy codebase
 */

export interface Folder {
  id: number;
  name: string;
  code: string;
  folder_type?: string;
  department_id?: number;
  department_name?: string;
  description?: string | null;
  document_count?: number;
  docs?: number; // Legacy alias
  owner_name?: string;
  create_date?: string | null;
  created_at?: string;
  updated_at?: string;
  state?: "active" | "archived";
  updated?: string; // Legacy alias
}

export interface FolderListParams {
  department_id?: number;
  folder_type?: string;
  state?: string;
}

export interface FolderListResponse {
  folders: Folder[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
