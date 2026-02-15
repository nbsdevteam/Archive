/** Attachment operations for documents */

import apiClient from '../client';
import type { Attachment } from './types';
import { getRpcResult, assertSuccess } from './utils';

/**
 * Add attachment to a document (JSON-RPC).
 */
export async function addAttachment(
  documentId: number,
  params: { name: string; file_name: string; file_data: string; description?: string | null; attachment_type?: string }
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const response = await apiClient.post(`/api/documents/${documentId}/add-attachment`, {
    jsonrpc: '2.0',
    method: 'call',
    params: { ...params, attachment_type: params.attachment_type ?? 'supporting' },
    id: 1,
  });
  const result = getRpcResult<{ success?: boolean; data?: unknown; error?: string; message?: string }>(response.data);
  assertSuccess(result, 'Failed to add attachment');
  return (result ?? { success: true }) as { success: boolean; data?: unknown; error?: string };
}

/**
 * List attachments for a document (NBS 8.1).
 */
export async function listAttachments(documentId: number): Promise<{ success: boolean; data: Attachment[] }> {
  const response = await apiClient.post(`/api/documents/${documentId}/attachments`, {
    jsonrpc: '2.0',
    method: 'call',
    params: {},
    id: 1,
  });
  const result = response.data.result ?? response.data;
  return result as { success: boolean; data: Attachment[] };
}

/**
 * Delete an attachment from a document (NBS 8.5).
 * Tries JSON-RPC POST first; falls back to HTTP DELETE if backend expects it.
 */
export async function deleteAttachment(
  documentId: number,
  attachmentId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiClient.post(
      `/api/documents/${documentId}/attachments/${attachmentId}`,
      {
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: 1,
      }
    );
    const result = getRpcResult<{ success?: boolean; error?: string; message?: string }>(response.data);
    assertSuccess(result, 'Failed to delete attachment');
    return (result ?? { success: true }) as { success: boolean; error?: string };
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404 || status === 405) {
      const deleteResponse = await apiClient.delete(
        `/api/documents/${documentId}/attachments/${attachmentId}`
      );
      const deleteResult = (deleteResponse.data ?? {}) as {
        success?: boolean;
        error?: string;
        message?: string;
      };
      assertSuccess(deleteResult, 'Failed to delete attachment');
      return { success: true };
    }
    throw err;
  }
}

/**
 * Update attachment metadata and optionally replace file.
 * POST /api/documents/<document_id>/attachments/<attachment_id>/update (JSON-RPC)
 * Params: name, description, attachment_type; optional file_data (base64), file_name for replace.
 */
export async function updateAttachment(
  documentId: number,
  attachmentId: number,
  params: {
    name?: string;
    description?: string | null;
    attachment_type?: string;
    file_data?: string;
    file_name?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const response = await apiClient.post(
    `/api/documents/${documentId}/attachments/${attachmentId}/update`,
    {
      jsonrpc: '2.0',
      method: 'call',
      params,
      id: 1,
    }
  );
  const result = getRpcResult<{ success?: boolean; error?: string; message?: string }>(
    response.data
  );
  assertSuccess(result, 'Failed to update attachment');
  return (result ?? { success: true }) as { success: boolean; error?: string };
}

/**
 * Upload multiple attachments to a document (NBS 8.6).
 * POST /api/documents/<document_id>/attachments/multiple (JSON-RPC)
 */
export async function uploadMultipleAttachments(
  documentId: number,
  attachments: Array<{
    name: string;
    file_name: string;
    file_data: string;
    description?: string | null;
    attachment_type?: string;
  }>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const response = await apiClient.post(
    `/api/documents/${documentId}/attachments/multiple`,
    {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        attachments: attachments.map((a) => ({
          ...a,
          attachment_type: a.attachment_type ?? 'supporting',
        })),
      },
      id: 1,
    }
  );
  const result = (response.data.result ?? response.data) as {
    success?: boolean;
    data?: unknown;
    error?: string;
    message?: string;
  };
  assertSuccess(result, 'Failed to upload attachments');
  return (result ?? { success: true }) as { success: boolean; data?: unknown; error?: string };
}
