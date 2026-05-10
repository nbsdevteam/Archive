/** Documents Report API – POST /api/documents/report */

import apiClient from '../client';

/** Filters accepted by the /api/documents/report endpoint. All fields are optional. */
export interface ReportParams {
  from_date?: string;
  to_date?: string;
  company_id?: number;
  company_name?: string;
  department_id?: number;
  department_name?: string;
  document_type_id?: number;
  document_type?: string;
  confidentiality_level?: string;
  uploader_id?: number;
  uploader_name?: string;
  folder_id?: number;
  folder_name?: string;
  /** "active" (default) | "archived" | "all" */
  state?: string;
  /** "main" | "sub" | "attachment" | "other" — filter by role within folder */
  document_role?: string;
  page?: number;
  /** Max 500 */
  per_page?: number;
}

/** A single document entry returned by the report endpoint. */
export interface ReportDocument {
  id: number;
  name: string;
  barcode: string;
  upload_date: string;
  /** dd-mm-yyyy from API; null when unset. */
  document_date?: string | null;
  uploader_id: number;
  uploader_name: string;
  department_id: number;
  department_name: string;
  document_type_id: number;
  document_type_name: string;
  company_id: number;
  company_name: string;
  folder_id: number | null;
  folder_name: string | null;
  confidentiality_level: string;
  state: string;
  version_count: number;
  ocr_status: string;
  po_number?: string | null;
  bl_number?: string | null;
  invoice_number?: string | null;
  container_number?: string | null;
  /** Role within folder context */
  document_role?: 'main' | 'sub' | 'attachment' | 'other';
  /** True when explicitly flagged as attachment to parent */
  is_attachment?: boolean;
  /** Parent document id when sub/attachment */
  parent_document_id?: number | null;
}

export interface ReportSummary {
  total: number;
  from_date: string;
  to_date: string;
  filters: Record<string, unknown>;
}

export interface ReportPagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ReportResult {
  summary: ReportSummary;
  data: ReportDocument[];
  pagination: ReportPagination;
}

/**
 * Fetch a documents report from the backend.
 * All params are optional; omitting them returns all documents up to today.
 */
export async function getDocumentsReport(params: ReportParams = {}): Promise<ReportResult> {
  const response = await apiClient.post('/api/documents/report', {
    jsonrpc: '2.0',
    method: 'call',
    id: 1,
    params,
  });

  const result = response.data?.result;
  if (!result?.success) {
    throw new Error(result?.error ?? 'Failed to fetch documents report');
  }

  return result as ReportResult;
}
