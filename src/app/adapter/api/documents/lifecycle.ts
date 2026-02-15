/** Document lifecycle operations (archive, trash, restore, permanent delete) */

import apiClient from '../client';
import { getRpcResult, toDocumentIds, postPermanentDelete, postRestore } from './utils';

/**
 * Archive one or many documents using the unified array payload.
 */
export async function archiveDocument(
  documentIds: number | number[]
): Promise<{ success: boolean; error?: string }> {
  const normalizedIds = toDocumentIds(documentIds);
  if (normalizedIds.length === 0) {
    return { success: true };
  }
  const response = await apiClient.post('/api/documents/archive', { ids: normalizedIds });
  const result = getRpcResult<{ success?: boolean; error?: string; message?: string }>(response.data ?? {});
  if (result && result.success === false) {
    throw new Error(result.error || result.message || 'Failed to archive document(s)');
  }
  return { success: true };
}

/**
 * Unarchive one or many documents using the unified array payload.
 */
export async function unarchiveDocument(
  documentIds: number | number[]
): Promise<{ success: boolean; error?: string }> {
  const normalizedIds = toDocumentIds(documentIds);
  if (normalizedIds.length === 0) {
    return { success: true };
  }
  const response = await apiClient.post('/api/documents/unarchive', { ids: normalizedIds });
  const result = getRpcResult<{ success?: boolean; error?: string; message?: string }>(response.data ?? {});
  if (result && result.success === false) {
    throw new Error(result.error || result.message || 'Failed to unarchive document(s)');
  }
  return { success: true };
}

/**
 * Move one or many documents to trash (soft delete).
 * Backend accepts body: { ids: number[] }.
 */
export async function trashDocument(
  documentIds: number | number[],
  permanent?: boolean
): Promise<void> {
  const normalizedIds = toDocumentIds(documentIds);
  if (normalizedIds.length === 0) return;
  
  if (permanent === true) {
    await postPermanentDelete(normalizedIds);
    return;
  }
  
  const response = await apiClient.post('/api/documents/trash', { ids: normalizedIds });
  const result = getRpcResult<{ success?: boolean; error?: string; message?: string }>(response.data ?? {});
  if (result && result.success === false) {
    throw new Error(result.error || result.message || 'Failed to trash document(s)');
  }
}

/**
 * Permanently delete one or many trashed documents.
 * Accepts single ID or array. Converts to array, calls postPermanentDelete, returns { ok: true }.
 */
export async function permanentDeleteDocument(documentIds: number | number[]): Promise<{ ok: true }> {
  return postPermanentDelete(toDocumentIds(documentIds));
}

/**
 * Restore one or many trashed documents.
 * Accepts single ID or array. Converts to array, calls postRestore, returns { success: boolean }.
 */
export async function restoreDocument(documentIds: number | number[]): Promise<{ success: boolean; message?: string }> {
  return postRestore(toDocumentIds(documentIds));
}

/**
 * Get trashed documents with optional pagination.
 */
export async function getTrashDocuments(
  params?: { page?: number; per_page?: number }
): Promise<{ success: boolean; data: unknown[]; pagination?: unknown }> {
  const response = await apiClient.post('/api/documents/trash', {
    jsonrpc: '2.0',
    method: 'call',
    params: params || {},
  });
  return response.data.result || response.data;
}
