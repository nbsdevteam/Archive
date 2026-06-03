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
  /** Business/document date (dd-mm-yyyy from API); null for legacy rows. */
  document_date?: string | null;
  /** Expiry date (dd-mm-yyyy from API); null when not set. */
  expiry_date?: string | null;
  /** Days before expiry to show reminder; null when not configured. */
  reminder_days?: number | null;
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
  /** Parent folder id (API may mirror folder_id when document is in a folder). */
  parent_folder_id?: number | null;
  /** Display name of the parent folder. */
  parent_folder_name?: string | null;
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
  /** Date-only filter (YYYY-MM-DD). Omit both to avoid date filter. */
  from_date?: string;
  to_date?: string;
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
  /** Optional; API accepts dd-mm-yyyy, yyyy-mm-dd, dd/mm/yyyy, yyyy/mm/dd. */
  document_date?: string;
  /** Optional expiry date (dd-mm-yyyy preferred). */
  expiry_date?: string;
  /** Optional reminder window in days before expiry. */
  reminder_days?: number;
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
  /** Set or change date (yyyy-mm-dd, dd-mm-yyyy, etc.); `null` clears. */
  document_date?: string | null;
  /** Set or change expiry (dd-mm-yyyy, etc.); `null` clears. */
  expiry_date?: string | null;
  /** Reminder days before expiry; `null` clears. */
  reminder_days?: number | null;
}

/** Params for POST /api/documents/set-reminders (bulk reminder/expiry update). */
export interface SetDocumentRemindersParams {
  reminder_days: number;
  /** When omitted, applies reminder_days to all active documents. */
  document_ids?: number[];
  /** Optional shared expiry for listed documents. */
  expiry_date?: string;
}

export interface SetDocumentRemindersResponse {
  success: boolean;
  updated: number;
  reminder_days: number;
  expiry_date?: string | null;
  error?: string;
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
  /** Total number of files that will be uploaded (required by backend for the job). */
  total_files: number;
  folder_id?: number;
  create_folder_per_file?: boolean;
  confidentiality_level?: ConfidentialityLevel;
  auto_ocr?: boolean;
  auto_barcode?: boolean;
  /** Optional company when creating folders per file (main multi upload). */
  company_id?: number;
}

export interface BulkUploadStartData {
  job_id: string;
  id?: number;
}

/** One file for multipart POST .../bulk-upload/{job_id}/upload-file */
export interface BulkUploadUploadFileParams {
  file: File;
  file_name: string;
  name: string;
  description?: string;
}

export interface BulkUploadUploadFileResponse {
  success: boolean;
  document_id?: number;
  folder_id?: number;
  parent_folder_id?: number;
  parent_folder_name?: string;
  processed?: number;
  successful?: number;
  failed?: number;
  total?: number;
  error?: string;
}

export interface BulkUploadFinalizeData {
  status: 'completed' | 'partial' | 'failed';
  successful?: number;
  failed?: number;
}

export interface BulkUploadProgressData {
  status?: string;
  total?: number;
  processed?: number;
  successful?: number;
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

/**
 * @deprecated Prefer `uploadSingleFile` + `uploadFilesWithConcurrency` (POST `/api/documents/upload/single`).
 * Legacy `POST /api/documents/bulk-upload/upload` loads all files in one request and breaks on large batches.
 */
export interface SingleCallBulkUploadParams {
  department_id: number;
  document_type_id: number;
  company_id?: number;
  /** Target folder for sub-document uploads (ignored when create_folder_per_file is true). */
  folder_id?: number;
  confidentiality_level?: ConfidentialityLevel;
  create_folder_per_file?: boolean;
  auto_ocr?: boolean;
  files: File[];
}

/** @deprecated Legacy single-call bulk upload response. Prefer `UploadSingleFileResponse` per file. */
export interface SingleCallBulkUploadResponse {
  success: boolean;
  job_id: string;
  status: string;
  total: number;
  successful: number;
  failed: number;
  error_log?: string | null;
  documents: Array<{
    file_name: string;
    success: boolean;
    document_id?: number;
    folder_id?: number;
    parent_folder_id?: number;
    parent_folder_name?: string;
    error?: string | null;
  }>;
}

/** POST `/api/documents/upload/single` — one file, raw binary body + metadata headers (NBS v2). */
export interface UploadSingleFileParams {
  file: File;
  department_id: number;
  document_type_id: number;
  /** Original filename; defaults to `file.name`. */
  file_name?: string;
  /** Display name in archive; defaults to filename stem. */
  name?: string;
  company_id?: number;
  confidentiality_level?: ConfidentialityLevel;
  /** Maps to `X-Create-Folder`; default `true` per API. */
  create_folder?: boolean;
  /** Maps to `X-Auto-Ocr`; default `true` per API. */
  auto_ocr?: boolean;
  /** Attach to existing folder (`X-Folder-Id`). */
  folder_id?: number;
  /** Sent as `X-Document-Date` when set (dd-mm-yyyy preferred; API accepts other formats). */
  document_date?: string;
}

/** JSON body from POST `/api/documents/upload/single`. */
export interface UploadSingleFileResponse {
  success: boolean;
  document_id?: number;
  document_name?: string;
  barcode?: string;
  folder_id?: number;
  folder_name?: string;
  ocr_queued?: boolean;
  error?: string;
}

/** One completed file from the concurrency upload helper. */
export interface UploadFileResult {
  file: File;
  success: boolean;
  document_id?: number;
  folder_id?: number;
  folder_name?: string;
  barcode?: string;
  error?: string;
}

/** Shared metadata for concurrent single-file uploads (excludes per-file `file`, `file_name`, `name`). */
export type UploadSingleFileBaseParams = Omit<UploadSingleFileParams, 'file' | 'file_name' | 'name'>;
