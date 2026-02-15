/** Batch operations for documents */

import apiClient from '../client';
import { getRpcResult, assertSuccess } from './utils';

/**
 * Move multiple documents to a folder (batch operation).
 * POST /api/documents/batch/move-folder (JSON-RPC). Params: document_ids, target_folder_id.
 */
export async function batchMoveDocumentsToFolder(
  documentIds: number[],
  targetFolderId: number
): Promise<{ success: boolean; error?: string }> {
  if (documentIds.length === 0) {
    return { success: true };
  }
  const response = await apiClient.post('/api/documents/batch/move-folder', {
    jsonrpc: '2.0',
    method: 'call',
    params: { document_ids: documentIds, target_folder_id: targetFolderId },
    id: 1,
  });
  const result = getRpcResult<{ success?: boolean; error?: string; message?: string }>(response.data);
  assertSuccess(result, 'Failed to move documents to destination folder');
  return (result ?? { success: true }) as { success: boolean; error?: string };
}
