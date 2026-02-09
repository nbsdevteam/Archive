/**
 * Documents feature types
 * Aligned with NBS API; canonical Document re-exported from app adapter
 */

export type { Document, DocumentDetail, DocumentVersion } from "../../../app/adapter/api/documents.api";

export interface DocumentListParams {
  department_id?: number;
  document_type_id?: number;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface DocumentListResponse {
  documents: import("../../../app/adapter/api/documents.api").Document[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
