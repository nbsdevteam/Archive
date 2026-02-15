/** Version management operations for documents */

import apiClient from '../client';
import type { DocumentVersion } from './types';
import { getRpcResult, assertSuccess } from './utils';

/**
 * Upload new version of a document.
 * POST /api/documents/<document_id>/upload-version (JSON-RPC)
 */
export async function uploadVersion(
  documentId: number,
  params: { file_data: string; file_name: string; change_description?: string; unlock_token?: string }
): Promise<{ success: boolean; data?: { version_id: number }; error?: string }> {
  const response = await apiClient.post(`/api/documents/${documentId}/upload-version`, {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      file_data: params.file_data,
      file_name: params.file_name,
      change_description: params.change_description || '',
      unlock_token: params.unlock_token || '',
    },
    id: 1,
  });
  const result = getRpcResult<{
    success?: boolean;
    data?: { version_id: number };
    error?: string;
    message?: string;
  }>(response.data);
  assertSuccess(result, 'Failed to upload version');
  return (result ?? { success: true }) as {
    success: boolean;
    data?: { version_id: number };
    error?: string;
  };
}

/**
 * Get all versions for a document.
 */
export async function getVersions(documentId: number): Promise<{ success: boolean; data: DocumentVersion[] }> {
  const response = await apiClient.post(`/api/documents/${documentId}/versions`, {
    jsonrpc: '2.0',
    method: 'call',
    params: { document_id: documentId },
  });
  return response.data.result || response.data;
}
