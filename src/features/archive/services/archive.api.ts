/**
 * Archive API module
 * Direct API calls based on API_DOCUMENTATION.md
 */

import { jsonRpcRequest, httpRequest, httpGet } from "../../../shared/lib/http";
import type {
  DocumentListParams,
  FolderListParams,
  UploadDocumentParams,
  DocumentListResponse,
  FolderListResponse,
  Document,
  Folder,
} from "../types/archive.types";

/**
 * List documents
 * POST /api/documents (type=jsonrpc)
 */
export const listDocuments = async (
  params: DocumentListParams = {}
): Promise<DocumentListResponse> => {
  const result = await jsonRpcRequest<DocumentListResponse>(
    "/api/documents",
    {
      department_id: params.department_id,
      document_type_id: params.document_type_id,
      status: params.status || "active",
      search: params.search,
      page: params.page || 1,
      per_page: params.per_page || 20,
    }
  );

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { documents: result as Document[] };
  }
  if (typeof result === "object" && "documents" in result) {
    return result as DocumentListResponse;
  }
  return { documents: [] };
};

/**
 * Get document details
 * POST /api/documents/<document_id> (type=jsonrpc)
 */
export const getDocument = async (documentId: number): Promise<Document> => {
  return await jsonRpcRequest<Document>(`/api/documents/${documentId}`, {});
};

/**
 * Upload a new document
 * POST /api/documents/upload (type=http)
 */
export const uploadDocument = async (
  params: UploadDocumentParams
): Promise<{ success: boolean; data?: Document; error?: string }> => {
  return await httpRequest<Document>("/api/documents/upload", params);
};

/**
 * Download a document
 * GET /api/documents/<document_id>/download (type=http)
 */
export const downloadDocument = async (
  documentId: number,
  versionId?: number
): Promise<Blob> => {
  const url = versionId
    ? `/api/documents/${documentId}/download?version_id=${versionId}`
    : `/api/documents/${documentId}/download`;

  const response = await httpGet<Blob>(url, {
    responseType: "blob",
  });

  return response;
};

/**
 * Archive a document
 * POST /api/documents/<document_id>/archive (type=jsonrpc)
 */
export const archiveDocument = async (
  documentId: number
): Promise<{ success: boolean; error?: string }> => {
  return await jsonRpcRequest(`/api/documents/${documentId}/archive`, {});
};

/**
 * Unarchive a document
 * POST /api/documents/<document_id>/unarchive (type=jsonrpc)
 */
export const unarchiveDocument = async (
  documentId: number
): Promise<{ success: boolean; error?: string }> => {
  return await jsonRpcRequest(`/api/documents/${documentId}/unarchive`, {});
};

/**
 * List folders
 * POST /api/folders (type=jsonrpc)
 */
export const listFolders = async (
  params: FolderListParams = {}
): Promise<FolderListResponse> => {
  const result = await jsonRpcRequest<FolderListResponse>("/api/folders", {
    department_id: params.department_id,
    folder_type: params.folder_type,
    state: params.state || "active",
  });

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { folders: result as Folder[] };
  }
  if (typeof result === "object" && "folders" in result) {
    return result as FolderListResponse;
  }
  return { folders: [] };
};

/**
 * Get folder details
 * POST /api/folders/<folder_id> (type=jsonrpc)
 */
export const getFolder = async (folderId: number): Promise<Folder> => {
  return await jsonRpcRequest<Folder>(`/api/folders/${folderId}`, {});
};

/**
 * Create a folder
 * POST /api/folders/create (type=jsonrpc)
 */
export const createFolder = async (params: {
  name: string;
  code: string;
  department_id: number;
  folder_type?: string;
  description?: string;
}): Promise<{ success: boolean; data?: Folder; error?: string }> => {
  return await jsonRpcRequest("/api/folders/create", params);
};
