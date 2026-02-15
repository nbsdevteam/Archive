/** Core document CRUD operations */

import apiClient from '../client';
import type {
  DocumentsResponse,
  DocumentDetailResponse,
  GetDocumentsParams,
  UploadDocumentRequest,
  UploadDocumentResponse,
  UpdateDocumentParams,
  UpdateDocumentResponse,
} from './types';
import { getRpcResult, assertSuccess } from './utils';

/**
 * Get list of documents with optional filters and pagination.
 */
export async function getDocuments(params?: GetDocumentsParams): Promise<DocumentsResponse> {
  const response = await apiClient.post('/api/documents', {
    jsonrpc: '2.0',
    method: 'call',
    params: params || {},
  });
  return response.data.result || response.data;
}

/**
 * Get single document details by ID.
 */
export async function getDocument(id: number): Promise<DocumentDetailResponse> {
  const response = await apiClient.post(`/api/documents/${id}`, {
    jsonrpc: '2.0',
    method: 'call',
    params: { document_id: id },
  });
  return response.data.result || response.data;
}

/**
 * Update document metadata (main or sub). POST /api/documents/<document_id>/update (JSON-RPC).
 * Backend may reject PUT with 405; use POST for JSON-RPC compatibility.
 */
export async function updateDocument(
  documentId: number,
  params: UpdateDocumentParams
): Promise<UpdateDocumentResponse> {
  const response = await apiClient.post(
    `/api/documents/${documentId}/update`,
    {
      jsonrpc: '2.0',
      method: 'call',
      params,
      id: 1,
    }
  );
  const result = getRpcResult<UpdateDocumentResponse>(response.data);
  assertSuccess(result, 'Failed to update document');
  return (result ?? { success: true }) as UpdateDocumentResponse;
}

/**
 * Upload new document.
 */
export async function uploadDocument(data: UploadDocumentRequest): Promise<UploadDocumentResponse> {
  const response = await apiClient.post('/api/documents/upload', data);
  return response.data;
}
