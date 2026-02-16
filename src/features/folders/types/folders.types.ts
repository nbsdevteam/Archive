/**
 * Folders feature types
 * Aligned with NBS_ARCHIVE_API_REFERENCE_FRONTEND.md (sections 6.1, 6.2, 6.8)
 */

import type { Document } from "../../../app/adapter/api/documents.api";

/** NBS 6.1 list folder item; legacy fields kept for backward compat */
export interface Folder {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  parent_id?: number;
  parent_name?: string;
  level?: number;
  full_path?: string;
  child_count?: number;
  document_count?: number;
  all_document_count?: number;
  department_id?: number;
  department_name?: string;
  restricted?: boolean;
  color?: string;
  icon?: string;
  sequence?: number;
  /** Legacy / backward compat */
  folder_type?: string;
  docs?: number;
  owner_name?: string;
  create_date?: string | null;
  created_at?: string;
  write_date?: string | null;
  updated_at?: string;
  state?: "active" | "archived";
  updated?: string;
  /** Notes system: number of notes on this folder (API 1.1) */
  note_count?: number;
  /** Notes system: quick user note for folder (API 1.1) */
  user_note?: string | null;
  /** Notes system: last modified including docs/notes (API 1.1) */
  last_modified?: string | null;
  /** Company/brand (optional). */
  company_id?: number | null;
  company_name?: string | null;
}

/** NBS 6.2 get folder: list fields + detail fields */
export interface FolderDetail extends Folder {
  allowed_users?: unknown[];
  allowed_groups?: unknown[];
  parent_path?: string;
  created_by?: string | null;
  create_date?: string | null;
  write_date?: string | null;
}

export interface FolderListParams {
  department_id?: number;
  parent_id?: number | false;
  folder_type?: string;
  state?: string;
  company_id?: number;
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

/** NBS 6.8 folder documents response; folder optional if backend does not return it */
export interface FolderDocumentsResponse {
  success?: boolean;
  data: Document[];
  folder?: FolderDetail;
}
