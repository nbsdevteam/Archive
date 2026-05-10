/** Bulk upload operations for documents */

import apiClient from '../client';
import type {
  StartBulkUploadParams,
  BulkUploadStartData,
  BulkUploadUploadFileParams,
  BulkUploadUploadFileResponse,
  BulkUploadFinalizeData,
  BulkUploadProgressData,
  ListBulkUploadJobsParams,
  SingleCallBulkUploadParams,
  SingleCallBulkUploadResponse,
  UploadSingleFileParams,
  UploadSingleFileResponse,
  UploadSingleFileBaseParams,
  UploadFileResult,
} from './types';
import { getRpcResult, assertSuccess } from './utils';

/**
 * Start a bulk upload job (NBS 11.1).
 * POST /api/documents/bulk-upload/start (JSON-RPC)
 */
export async function startBulkUpload(
  params: StartBulkUploadParams
): Promise<{ success: boolean; data?: BulkUploadStartData; error?: string }> {
  const response = await apiClient.post('/api/documents/bulk-upload/start', {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      ...params,
      confidentiality_level: params.confidentiality_level ?? 'internal',
      auto_ocr: params.auto_ocr ?? false,
      auto_barcode: params.auto_barcode ?? false,
    },
    id: 1,
  });
  const result = getRpcResult<{ success?: boolean; data?: BulkUploadStartData; error?: string; message?: string }>(
    response.data
  );
  assertSuccess(result, 'Failed to start bulk upload job');
  return (result ?? { success: true }) as { success: boolean; data?: BulkUploadStartData; error?: string };
}

/**
 * Upload one file to a bulk upload job (raw binary with headers).
 * POST /api/documents/bulk-upload/<job_id>/upload-file
 * Uses native fetch to send raw File bytes, bypassing axios JSON interceptors.
 */
export async function uploadFileToBulkJob(
  jobId: string,
  params: BulkUploadUploadFileParams
): Promise<BulkUploadUploadFileResponse> {
  const token = localStorage.getItem('access_token');
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const response = await fetch(`${apiBaseUrl}/api/documents/bulk-upload/${jobId}/upload-file`, {
    method: 'POST',
    headers: {
      'Content-Type': params.file.type || 'application/octet-stream',
      'X-File-Name': params.file_name,
      'X-Doc-Name': params.name,
      ...(params.description && { 'X-Doc-Description': params.description }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: params.file,
    credentials: 'include',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }
  const body = (await response.json()) as BulkUploadUploadFileResponse;
  const result = getRpcResult<BulkUploadUploadFileResponse>(body);
  assertSuccess(result, 'Failed to upload file to bulk job');
  return result;
}

/**
 * Finalize a bulk upload job after all per-file uploads.
 * POST /api/documents/bulk-upload/<job_id>/finalize
 */
export async function finalizeBulkUpload(jobId: string): Promise<BulkUploadFinalizeData> {
  const response = await apiClient.post(`/api/documents/bulk-upload/${jobId}/finalize`, {});
  const body = getRpcResult<BulkUploadFinalizeData>(response.data ?? {});
  return body;
}

/**
 * Get bulk upload job progress (NBS 11.3).
 * POST /api/documents/bulk-upload/<job_id>/progress (JSON-RPC)
 */
export async function getBulkUploadProgress(
  jobId: string
): Promise<{ success: boolean; data?: BulkUploadProgressData; error?: string }> {
  const response = await apiClient.post(`/api/documents/bulk-upload/${jobId}/progress`, {
    jsonrpc: '2.0',
    method: 'call',
    params: {},
    id: 1,
  });
  const result = getRpcResult<{ success?: boolean; data?: BulkUploadProgressData; error?: string; message?: string }>(
    response.data
  );
  assertSuccess(result, 'Failed to get bulk upload progress');
  return (result ?? { success: true }) as { success: boolean; data?: BulkUploadProgressData; error?: string };
}

/**
 * Cancel a bulk upload job (NBS 11.4).
 * POST /api/documents/bulk-upload/<job_id>/cancel (JSON-RPC)
 */
export async function cancelBulkUploadJob(jobId: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const response = await apiClient.post(`/api/documents/bulk-upload/${jobId}/cancel`, {
    jsonrpc: '2.0',
    method: 'call',
    params: {},
    id: 1,
  });
  const result = getRpcResult<{ success?: boolean; data?: unknown; error?: string; message?: string }>(response.data);
  assertSuccess(result, 'Failed to cancel bulk upload job');
  return (result ?? { success: true }) as { success: boolean; data?: unknown; error?: string };
}

/**
 * List bulk upload jobs (NBS 11.5).
 * POST /api/documents/bulk-upload/jobs (JSON-RPC)
 */
export async function listBulkUploadJobs(
  params?: ListBulkUploadJobsParams
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const response = await apiClient.post('/api/documents/bulk-upload/jobs', {
    jsonrpc: '2.0',
    method: 'call',
    params: params ?? {},
    id: 1,
  });
  const result = getRpcResult<{ success?: boolean; data?: unknown; error?: string; message?: string }>(response.data);
  assertSuccess(result, 'Failed to list bulk upload jobs');
  return (result ?? { success: true }) as { success: boolean; data?: unknown; error?: string };
}

/** Display name stem (strip last extension). */
function fileNameStem(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

/**
 * Upload exactly one file (NBS v2). POST `/api/documents/upload/single`
 * Raw binary body; metadata in headers. OCR is queued server-side after save.
 */
export async function uploadSingleFile(params: UploadSingleFileParams): Promise<UploadSingleFileResponse> {
  const token = localStorage.getItem('access_token');
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const fileName = params.file_name ?? params.file.name;
  const docName = params.name ?? fileNameStem(params.file.name);

  const headers: Record<string, string> = {
    'Content-Type': params.file.type || 'application/octet-stream',
    'X-File-Name': fileName,
    'X-Doc-Name': docName,
    'X-Department-Id': String(params.department_id),
    'X-Document-Type-Id': String(params.document_type_id),
    'X-Confidentiality': params.confidentiality_level ?? 'internal',
    'X-Create-Folder': String(params.create_folder ?? true),
    'X-Auto-Ocr': String(params.auto_ocr ?? true),
  };
  if (params.company_id != null && params.company_id >= 1) {
    headers['X-Company-Id'] = String(params.company_id);
  }
  if (params.folder_id != null && params.folder_id >= 1) {
    headers['X-Folder-Id'] = String(params.folder_id);
  }
  const docDate = params.document_date?.trim();
  if (docDate) {
    headers['X-Document-Date'] = docDate;
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}/api/documents/upload/single`, {
    method: 'POST',
    headers,
    body: params.file,
    credentials: 'include',
  });

  let body: UploadSingleFileResponse;
  try {
    body = (await response.json()) as UploadSingleFileResponse;
  } catch {
    throw new Error(`Upload failed: HTTP ${response.status} (invalid response body)`);
  }

  if (!response.ok) {
    throw new Error(body.error || `Upload failed: HTTP ${response.status}`);
  }
  if (body.success === false) {
    throw new Error(body.error || 'Upload failed');
  }
  return body;
}

export const DEFAULT_UPLOAD_CONCURRENCY = 4;

export interface UploadFilesWithConcurrencyOptions {
  concurrency?: number;
  onProgress?: (done: number, total: number, result: UploadFileResult) => void;
  cancelledRef?: { current: boolean };
}

/**
 * Upload many files with a bounded worker pool (NBS v2). One HTTP request per file.
 * Failures are isolated per file; cancellation stops picking new files.
 */
export async function uploadFilesWithConcurrency(
  files: File[],
  baseParams: UploadSingleFileBaseParams,
  options?: UploadFilesWithConcurrencyOptions
): Promise<UploadFileResult[]> {
  const total = files.length;
  if (total === 0) return [];

  const concurrency = Math.max(1, Math.min(options?.concurrency ?? DEFAULT_UPLOAD_CONCURRENCY, total));
  const onProgress = options?.onProgress;
  const cancelledRef = options?.cancelledRef;

  const results: UploadFileResult[] = [];
  let idx = 0;

  async function worker(): Promise<void> {
    for (;;) {
      if (cancelledRef?.current) return;
      const i = idx++;
      if (i >= total) return;
      const file = files[i];
      let result: UploadFileResult;
      try {
        const json = await uploadSingleFile({
          ...baseParams,
          file,
          file_name: file.name,
          name: fileNameStem(file.name),
        });
        const ok = Boolean(json.success);
        result = {
          file,
          success: ok,
          document_id: json.document_id,
          folder_id: json.folder_id,
          folder_name: json.folder_name,
          barcode: json.barcode,
          error: ok ? undefined : json.error,
        };
      } catch (err) {
        result = {
          file,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
      results.push(result);
      onProgress?.(results.length, total, result);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

/**
 * @deprecated Legacy single-call multipart upload. Prefer {@link uploadFilesWithConcurrency}.
 * POST /api/documents/bulk-upload/upload — all files in one request.
 */
export async function singleCallBulkUpload(
  params: SingleCallBulkUploadParams
): Promise<SingleCallBulkUploadResponse> {
  const token = localStorage.getItem('access_token');
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  const formData = new FormData();
  formData.append('department_id', params.department_id.toString());
  formData.append('document_type_id', params.document_type_id.toString());
  
  if (params.company_id) {
    formData.append('company_id', params.company_id.toString());
  }
  if (params.folder_id) {
    formData.append('folder_id', params.folder_id.toString());
  }
  if (params.confidentiality_level) {
    formData.append('confidentiality_level', params.confidentiality_level);
  }
  if (params.create_folder_per_file !== undefined) {
    formData.append('create_folder_per_file', params.create_folder_per_file.toString());
  }
  if (params.auto_ocr !== undefined) {
    formData.append('auto_ocr', params.auto_ocr.toString());
  }
  
  // Add all files using the same field name "file"
  for (const file of params.files) {
    formData.append('file', file);
  }
  
  const response = await fetch(`${apiBaseUrl}/api/documents/bulk-upload/upload`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Single-call bulk upload failed: ${response.status} ${errorText}`);
  }
  
  const result = await response.json() as SingleCallBulkUploadResponse;
  return result;
}
