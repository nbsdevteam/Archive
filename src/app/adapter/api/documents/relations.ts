/** Document relations operations */

import apiClient from '../client';

/**
 * Get document relations (parent + related documents).
 */
export async function getRelations(documentId: number): Promise<{
  success: boolean;
  data?: {
    parent?: { id: number; title: string; barcode?: string } | null;
    related?: Array<{ id: number; title: string; barcode?: string; relation_type?: string; notes?: string }>;
  };
}> {
  const response = await apiClient.post(`/api/documents/${documentId}/relations`, {
    jsonrpc: '2.0',
    method: 'call',
    params: {},
    id: 1,
  });
  return response.data.result ?? response.data;
}

/**
 * Add relation to another document.
 */
export async function addRelation(
  documentId: number,
  params: { related_document_id: number; relation_type?: string; notes?: string }
): Promise<{ success: boolean }> {
  const response = await apiClient.post(`/api/documents/${documentId}/add-relation`, {
    jsonrpc: '2.0',
    method: 'call',
    params,
    id: 1,
  });
  return response.data.result ?? response.data;
}

/**
 * Set or clear parent document.
 */
export async function setParent(
  documentId: number,
  parentDocumentId: number | null
): Promise<{ success: boolean }> {
  const response = await apiClient.post(`/api/documents/${documentId}/set-parent`, {
    jsonrpc: '2.0',
    method: 'call',
    params: { parent_document_id: parentDocumentId },
    id: 1,
  });
  return response.data.result ?? response.data;
}
