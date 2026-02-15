/** Bulk upload operations for documents */

import apiClient from '../client';
import type {
  StartBulkUploadParams,
  BulkUploadStartData,
  BulkUploadFilePayload,
  BulkUploadProgressData,
  ListBulkUploadJobsParams,
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
 * Upload one or more files to a bulk upload job (NBS 11.2).
 * POST /api/documents/bulk-upload/<job_id>/upload (JSON-RPC)
 */
export async function uploadFilesToBulkJob(
  jobId: string,
  files: BulkUploadFilePayload[]
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const response = await apiClient.post(`/api/documents/bulk-upload/${jobId}/upload`, {
    jsonrpc: '2.0',
    method: 'call',
    params: { files },
    id: 1,
  });
  const result = getRpcResult<{ success?: boolean; data?: unknown; error?: string; message?: string }>(response.data);
  assertSuccess(result, 'Failed to upload files to bulk job');
  return (result ?? { success: true }) as { success: boolean; data?: unknown; error?: string };
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
