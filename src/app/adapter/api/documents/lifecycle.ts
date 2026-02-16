/** Document lifecycle operations (archive, trash, restore, permanent delete) */

import apiClient from '../client';
import type { DeleteLikeResponse } from './types';
import { toDocumentIds, postPermanentDelete, postRestore } from './utils';
import { mapApiDatesToArabianStandardTime } from '@/shared/utils/format/mapApiDatesToArabianStandardTime';

/**
 * Archive one or many documents. POST /api/documents/batch/archive (JSON-RPC).
 * Params: { document_ids: number[] }.
 */
export async function archiveDocument(
  documentIds: number | number[]
): Promise<{ success: boolean; error?: string }> {
  const normalizedIds = toDocumentIds(documentIds);
  if (normalizedIds.length === 0) {
    return { success: true };
  }
  const response = await apiClient.post('/api/documents/batch/archive', {
    jsonrpc: '2.0',
    method: 'call',
    params: { document_ids: normalizedIds },
    id: 1,
  });
  const result = (response.data?.result ?? response.data) as DeleteLikeResponse | undefined;
  if (result && result.success === false && result.error) {
    throw new Error(result.error);
  }
  return (result ?? { success: true }) as { success: boolean; error?: string };
}

/**
 * Unarchive one or many documents. POST /api/documents/batch/unarchive (JSON-RPC).
 * Params: { document_ids: number[] }.
 */
export async function unarchiveDocument(
  documentIds: number | number[]
): Promise<{ success: boolean; error?: string }> {
  const normalizedIds = toDocumentIds(documentIds);
  if (normalizedIds.length === 0) {
    return { success: true };
  }
  const response = await apiClient.post('/api/documents/batch/unarchive', {
    jsonrpc: '2.0',
    method: 'call',
    params: { document_ids: normalizedIds },
    id: 1,
  });
  const result = (response.data?.result ?? response.data) as DeleteLikeResponse | undefined;
  if (result && result.success === false && result.error) {
    throw new Error(result.error);
  }
  return (result ?? { success: true }) as { success: boolean; error?: string };
}

/**
 * Move one or many documents to trash (soft delete). POST /api/documents/batch/trash (JSON-RPC).
 * Params: { document_ids: number[] } or { document_ids: number[], reason?: string }.
 */
export async function trashDocument(
  documentIds: number | number[],
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  const normalizedIds = toDocumentIds(documentIds);
  if (normalizedIds.length === 0) {
    return { success: true };
  }
  const response = await apiClient.post('/api/documents/batch/trash', {
    jsonrpc: '2.0',
    method: 'call',
    params: reason ? { document_ids: normalizedIds, reason } : { document_ids: normalizedIds },
    id: 1,
  });
  const result = (response.data?.result ?? response.data) as DeleteLikeResponse | undefined;
  if (result && result.success === false) {
    throw new Error(result.error || result.message || 'Failed to move documents to trash');
  }
  return (result ?? { success: true }) as { success: boolean; message?: string };
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

/** Trash list item: document with optional deleted/restore fields. */
type TrashDoc = import('./types').Document & { deleted_at?: string; restore_deadline?: string };

/**
 * Get trashed documents with optional pagination. POST /api/documents/trash (JSON-RPC).
 */
export async function getTrashDocuments(
  params?: { page?: number; per_page?: number; search?: string }
): Promise<{ success: boolean; data: TrashDoc[]; pagination?: { total: number; page: number; per_page: number; total_pages: number } }> {
  const response = await apiClient.post('/api/documents/trash', {
    jsonrpc: '2.0',
    method: 'call',
    params: params || {},
  });
  const result = response.data.result || response.data;
  if (result && (result as { success?: boolean }).success === false) {
    throw new Error(
      (result as { error?: string; message?: string }).error ||
        (result as { message?: string }).message ||
        'Failed to load trash'
    );
  }
  const typed = result as { success: boolean; data?: TrashDoc[]; pagination?: { total: number; page: number; per_page: number; total_pages: number } };
  const data = Array.isArray(typed.data) ? typed.data : [];
  return {
    success: typed.success,
    data: mapApiDatesToArabianStandardTime(data),
    pagination: typed.pagination,
  };
}
