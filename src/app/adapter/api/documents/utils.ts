/** Shared utility functions for documents API */

import type { DeleteLikeResponse, RestoreResponse } from './types';
import apiClient from '../client';

/**
 * Extracts result from JSON-RPC response envelope if present, otherwise returns payload as-is.
 */
export const getRpcResult = <T>(payload: unknown): T => {
  const maybeWrapped = payload as { result?: T } | T;
  if (
    maybeWrapped &&
    typeof maybeWrapped === 'object' &&
    'result' in maybeWrapped &&
    (maybeWrapped as { result?: T }).result !== undefined
  ) {
    return (maybeWrapped as { result: T }).result;
  }
  return maybeWrapped as T;
};

/**
 * Throws error if result indicates failure.
 */
export const assertSuccess = (
  result: { success?: boolean; error?: string; message?: string } | undefined,
  fallbackMessage: string
): void => {
  if (!result) return;
  if (result.success === false) {
    throw new Error(result.error || result.message || fallbackMessage);
  }
};

/**
 * Performs permanent delete for one or many document IDs via unified endpoint.
 * Backend accepts body: { ids: number[] }.
 */
export const postPermanentDelete = async (documentIds: number[]): Promise<{ ok: true }> => {
  if (documentIds.length === 0) {
    return { ok: true };
  }
  const response = await apiClient.post('/api/documents/permanent-delete', {
    ids: documentIds,
  });
  const result = getRpcResult<DeleteLikeResponse>(response.data ?? {});
  if (result && result.success === false) {
    throw new Error(result.error || result.message || 'Failed to permanently delete document(s)');
  }
  if (result && result.error && result.success !== true) {
    throw new Error(result.error || result.message || 'Failed to permanently delete document(s)');
  }
  return { ok: true };
};

/**
 * Restores one or many trashed document IDs via unified endpoint.
 * Backend accepts body: { ids: number[] }, returns { restored: number[], failed: number[] }.
 * Parses that shape and returns restored/failed arrays so callers can show correct toasts.
 */
export const postRestore = async (documentIds: number[]): Promise<{ restored: number[]; failed: number[] }> => {
  if (documentIds.length === 0) {
    return { restored: [], failed: [] };
  }
  const response = await apiClient.post('/api/documents/restore', {
    ids: documentIds,
  });
  const result = getRpcResult<RestoreResponse & DeleteLikeResponse>(response.data ?? {});
  if (result && result.success === false) {
    throw new Error(result.error || result.message || 'Failed to restore document(s)');
  }
  if (result && typeof result === 'object' && result.error && result.success !== true) {
    throw new Error(result.error || result.message || 'Failed to restore document(s)');
  }
  const restored = Array.isArray((result as RestoreResponse)?.restored) ? (result as RestoreResponse).restored! : [];
  const failed = Array.isArray((result as RestoreResponse)?.failed) ? (result as RestoreResponse).failed! : [];
  return { restored, failed };
};

/**
 * Normalizes single or multi document input into an ID array.
 */
export const toDocumentIds = (documentIds: number | number[]): number[] =>
  (Array.isArray(documentIds) ? documentIds : [documentIds]).filter(
    (id): id is number => Number.isFinite(id)
  );

/**
 * Infers MIME type for preview blob from response header and file extension.
 */
export function inferPreviewContentType(headerType: string, ext: string): string {
  if (headerType && headerType !== 'application/octet-stream') return headerType;
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'bmp') return 'image/bmp';
  if (ext === 'svg') return 'image/svg+xml';
  return headerType || 'application/octet-stream';
}
