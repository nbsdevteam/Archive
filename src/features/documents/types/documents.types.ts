/**
 * Documents feature types
 * Based on API_DOCUMENTATION.md and legacy codebase
 */

export interface Document {
  id: number;
  name?: string;
  title?: string;
  barcode?: string;
  document_type_name?: string;
  document_type?: {
    id: number;
    name: string;
  };
  department_name?: string;
  department?: {
    id: number;
    name: string;
  };
  upload_date?: string;
  status?: "active" | "archived" | "pending" | "failed" | "error" | "rejected";
  state?: "active" | "archived";
  type?: string;
  updated?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentListParams {
  department_id?: number;
  document_type_id?: number;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
