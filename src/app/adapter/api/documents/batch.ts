/** Batch operations for documents */

import apiClient from '../client';
import { getRpcResult, assertSuccess } from './utils';

/**
 * Move multiple documents to a folder (batch operation).
 * POST /api/documents/batch/move-to-folder (JSON-RPC)
 */
export async function batchMoveDocumentsToFolder(
  documentIds: number[],
  folderId: number
): Promise<{ success: boolean; error?: string }> {
  const response = await apiClient.post('/api/documents/batch/move-to-folder', {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      document_ids: documentIds,
      folder_id: folderId,
    },
    id: 1,
  });
  const result = getRpcResult<{ success?: boolean; error?: string; message?: string }>(response.data);
  assertSuccess(result, 'Failed to move documents to folder');
  return (result ?? { success: true }) as { success: boolean; error?: string };
}
