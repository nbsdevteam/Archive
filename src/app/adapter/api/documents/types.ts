/** All type definitions for documents API */

export type UploadKind = 'main' | 'sub' | 'attachment';
export type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'strict';

export interface Document {
  id: number;
  /**
   * Some endpoints/older payloads may send `name` instead of `title`.
   * We keep it optional for backward compatibility in the UI.
   */
  name?: string;
  title: string;
  department_id: number;
  department_name: string;
  /**
   * Some list payloads may include nested objects (depending on backend serializer).
   * Keep these optional so the UI can safely read either form.
   */
  department?: { name: string };
  document_type_id: number;
  document_type_name: string;
  document_type?: { name: string };
  uploader_id: number;
  uploader_name: string;
  upload_date: string;
  status: string;
  confidentiality_level: string;
  barcode: string;
  file_name: string;
  /** File size in bytes; API may return 0 when unknown. */
  file_size: number;
  /** Optional shipping/logistics fields; API returns false when not set. */
  po_number?: string | false;
  bl_number?: string | false;
  container_number?: string | false;
  invoice_number?: string | false;
  envoy_number?: string | false;
  /** Folder assignment; null when document is not in a folder. */
  folder_id?: number | null;
  /** Display name of the folder (e.g. "FIN-RCPT-testyTarget_398"). */
  folder_name?: string | null;
  /** For sub-documents: parent main document id. */
  parent_document_id?: number | null;
  /** True when this document is a main document (can be transferred to folder); false for sub/attachment. */
  is_main_document?: boolean;
  /** Document role: e.g. "main" | "sub". */
  document_role?: string;
  /** Folder documents API: role in folder – "main" | "sub" | "other". Main = main doc; sub/other = secondary. */
  folder_role?: string;
  /** Relation type when linked to another document, e.g. "secondary_document". */
  relation_type?: string | null;
  /** Number of notes on this document. */
  note_count?: number;
  /** Last modified timestamp (including versions/notes). */
  last_modified?: string | null;
  /** Company/brand from folder (optional). */
  company_id?: number | null;
  company_name?: string | null;
}

export interface DocumentVersion {
  id: number;
  version_number: number;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  upload_date: string;
  change_description: string;
  ocr_completed?: boolean;
  ocr_date?: string | null;
}

export interface DocumentDetail extends Document {
  is_locked: boolean;
  tags: Array<{ id: number; name: string }>;
  versions: DocumentVersion[];
  ocr_status?: string;
  ocr?: {
    current_version_id?: number | null;
    current_version_ocr_completed?: boolean;
    current_version_ocr_date?: string | null;
    extracted_text_preview?: string;
    extracted_text_length?: number;
  };
}

/** NBS 8.1 attachment object; upload_date kept for backward compat */
export interface Attachment {
  id: number;
  name: string;
  file_name: string;
  description?: string | null;
  attachment_type?: string;
  created_date?: string;
  file_size?: number;
  upload_date?: string;
}

export interface DocumentsResponse {
  success: boolean;
  data: Document[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface DocumentDetailResponse {
  success: boolean;
  data: DocumentDetail;
}

export interface TrashDocumentsResponse {
  success: boolean;
  data: Array<Document & { deleted_at?: string; restore_deadline?: string }>;
  pagination?: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface GetDocumentsParams {
  department_id?: number;
  document_type_id?: number;
  company_id?: number;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface UploadDocumentRequest {
  department_id: number;
  document_type_id: number;
  title: string;
  file_data: string; // base64
  file_name: string;
  confidentiality_level?: ConfidentialityLevel;
  folder_id?: number;
  folder_ids?: number[];
  upload_kind?: UploadKind;
  parent_document_id?: number;
  create_folder?: boolean;
  folder_name?: string;
  folder_code?: string;
  folder_type?: string;
  folder_description?: string | null;
  po_number?: string;
  bl_number?: string;
  container_number?: string;
  invoice_number?: string;
  envoy_number?: string;
  tags?: number[];
  custom_fields?: Record<string, unknown>;
}

export interface UploadDocumentResponse {
  success: boolean;
  data: { id: number; barcode: string };
  error?: string;
}

/** Params for updating document metadata (main or sub). All fields optional. */
export interface UpdateDocumentParams {
  title?: string;
  department_id?: number;
  document_type_id?: number;
  confidentiality_level?: ConfidentialityLevel;
  folder_id?: number | null;
  po_number?: string;
  bl_number?: string;
  container_number?: string;
  invoice_number?: string;
  envoy_number?: string;
  tags?: number[];
}

export interface UpdateDocumentResponse {
  success: boolean;
  data?: DocumentDetail | Document;
  error?: string;
  message?: string;
}

export interface StartBulkUploadParams {
  department_id: number;
  document_type_id: number;
  folder_id?: number;
  create_folder_per_file?: boolean;
  confidentiality_level?: ConfidentialityLevel;
  auto_ocr?: boolean;
  auto_barcode?: boolean;
}

export interface BulkUploadStartData {
  job_id: string;
  id?: number;
}

export interface BulkUploadFilePayload {
  file_name: string;
  file_data: string;
  name: string;
  description?: string;
}

export interface BulkUploadProgressData {
  status?: string;
  total?: number;
  processed?: number;
  failed?: number;
}

export interface ListBulkUploadJobsParams {
  status?: string;
  limit?: number;
  offset?: number;
}

export interface DeleteLikeResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

/** Response from POST /api/documents/restore: lists restored and failed document IDs. */
export interface RestoreResponse {
  restored?: number[];
  failed?: number[];
}
