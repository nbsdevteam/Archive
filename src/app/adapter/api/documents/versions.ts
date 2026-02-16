/** Version management operations for documents */

import apiClient from '../client';
import type { DocumentVersion } from './types';
import { mapApiDatesToArabianStandardTime } from '@/shared/utils/format/mapApiDatesToArabianStandardTime';

/**
 * Upload new version of a document.
 * POST /api/documents/<document_id>/upload-version (JSON-RPC). No id in body (baseline).
 */
export async function uploadVersion(
  documentId: number,
  params: { file_data: string; file_name: string; change_description?: string; unlock_token?: string }
): Promise<{ success: boolean }> {
  const response = await apiClient.post(`/api/documents/${documentId}/upload-version`, {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      file_data: params.file_data,
      file_name: params.file_name,
      unlock_token: params.unlock_token ?? '',
      change_description: params.change_description ?? '',
    },
  });
  return response.data.result || response.data;
}

/**
 * Get all versions for a document.
 * Date fields in versions are mapped to Arabia Standard Time for display.
 */
export async function getVersions(documentId: number): Promise<{ success: boolean; data: DocumentVersion[] }> {
  const response = await apiClient.post(`/api/documents/${documentId}/versions`, {
    jsonrpc: '2.0',
    method: 'call',
    params: { document_id: documentId },
  });
  const raw = response.data.result || response.data;
  return mapApiDatesToArabianStandardTime(raw);
}
