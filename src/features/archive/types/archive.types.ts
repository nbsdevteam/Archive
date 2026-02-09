/**
 * Archive feature types
 * Aligned with canonical API types (NBS); legacy fields kept for archive UI and static data
 */

import type { Document as AdapterDocument } from "../../../app/adapter/api/documents.api";
import type { Folder as FoldersFolder } from "../../folders/types/folders.types";

/** Canonical document + legacy archive fields (type, updated) for backward compat */
export type Document = AdapterDocument & { type?: string; updated?: string };

/** Canonical folder (NBS 6.1); re-exported so archive API and UI use same shape */
export type Folder = FoldersFolder;

export interface FolderStats {
  totalFolders: number;
  sharedFolders: number;
  updatedThisWeek: number;
  storageUsed: string;
}

export interface DocumentListParams {
  department_id?: number;
  document_type_id?: number;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface FolderListParams {
  department_id?: number;
  folder_type?: string;
  state?: string;
}

export interface UploadDocumentParams {
  department_id: number;
  document_type_id: number;
  title: string;
  file_data: string; // base64
  file_name: string;
  confidentiality_level?: string;
  po_number?: string;
  bl_number?: string;
  container_number?: string;
  invoice_number?: string;
  envoy_number?: string;
  tags?: number[];
  custom_fields?: Record<string, unknown>;
  folder_id?: number;
  folder_ids?: number[];
  upload_kind?: "main" | "sub" | "attachment";
  parent_document_id?: number;
  create_folder?: boolean;
  folder_name?: string;
  folder_code?: string;
  folder_type?: string;
  folder_description?: string;
}

export interface ApiPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination?: ApiPagination;
}

export interface FolderListResponse {
  folders: Folder[];
  pagination?: ApiPagination;
}
