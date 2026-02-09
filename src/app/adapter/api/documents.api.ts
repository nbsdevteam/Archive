import apiClient from './client';

export type UploadKind = 'main' | 'sub' | 'attachment';
export type ConfidentialityLevel = 'public' | 'internal' | 'confidential' | 'strict';

export interface Document {
  id: number;
  /**
   * Some endpoints/older payloads may send `name` instead of `title`.
   * We keep it optional for backward compatibility in the UI.
   */
  name?: string;
  title: string;
  department_id: number;
  department_name: string;
  /**
   * Some list payloads may include nested objects (depending on backend serializer).
   * Keep these optional so the UI can safely read either form.
   */
  department?: { name: string };
  document_type_id: number;
  document_type_name: string;
  document_type?: { name: string };
  uploader_id: number;
  uploader_name: string;
  upload_date: string;
  status: string;
  confidentiality_level: string;
  barcode: string;
  file_name: string;
  file_size: number;
}

export interface DocumentVersion {
  id: number;
  version_number: number;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  upload_date: string;
  change_description: string;
  ocr_completed?: boolean;
  ocr_date?: string | null;
}

export interface DocumentDetail extends Document {
  is_locked: boolean;
  tags: Array<{ id: number; name: string }>;
  versions: DocumentVersion[];
  ocr_status?: string;
  ocr?: {
    current_version_id?: number | null;
    current_version_ocr_completed?: boolean;
    current_version_ocr_date?: string | null;
    extracted_text_preview?: string;
    extracted_text_length?: number;
  };
}

/** NBS 8.1 attachment object; upload_date kept for backward compat */
export interface Attachment {
  id: number;
  name: string;
  file_name: string;
  description?: string | null;
  attachment_type?: string;
  created_date?: string;
  file_size?: number;
  upload_date?: string;
}

export interface DocumentsResponse {
  success: boolean;
  data: Document[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface DocumentDetailResponse {
  success: boolean;
  data: DocumentDetail;
}

export interface TrashDocumentsResponse {
  success: boolean;
  data: Array<Document & { deleted_at?: string; restore_deadline?: string }>;
  pagination?: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface GetDocumentsParams {
  department_id?: number;
  document_type_id?: number;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface UploadDocumentRequest {
  department_id: number;
  document_type_id: number;
  title: string;
  file_data: string; // base64
  file_name: string;
  confidentiality_level?: ConfidentialityLevel;
  folder_id?: number;
  folder_ids?: number[];
  upload_kind?: UploadKind;
  parent_document_id?: number;
  create_folder?: boolean;
  folder_name?: string;
  folder_code?: string;
  folder_type?: string;
  folder_description?: string | null;
  po_number?: string;
  bl_number?: string;
  container_number?: string;
  invoice_number?: string;
  envoy_number?: string;
  tags?: number[];
  custom_fields?: Record<string, unknown>;
}

export interface UploadDocumentResponse {
  success: boolean;
  data: { id: number; barcode: string };
  error?: string;
}

export interface DeleteLikeResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

export const documentsApi = {
  /**
   * Get list of documents
   */
  getDocuments: async (params?: GetDocumentsParams): Promise<DocumentsResponse> => {
    const response = await apiClient.post('/api/documents', {
      jsonrpc: '2.0',
      method: 'call',
      params: params || {},
    });
    return response.data.result || response.data;
  },

  /**
   * Get single document details
   */
  getDocument: async (id: number): Promise<DocumentDetailResponse> => {
    const response = await apiClient.post(`/api/documents/${id}`, {
      jsonrpc: '2.0',
      method: 'call',
      params: { document_id: id },
    });
    return response.data.result || response.data;
  },

  /**
   * Upload new document
   */
  uploadDocument: async (data: UploadDocumentRequest): Promise<UploadDocumentResponse> => {
    const response = await apiClient.post('/api/documents/upload', data);
    return response.data;
  },

  /**
   * Add attachment to a document (JSON-RPC)
   */
  addAttachment: async (
    documentId: number,
    params: { name: string; file_name: string; file_data: string; description?: string | null; attachment_type?: string }
  ): Promise<{ success: boolean; data?: unknown; error?: string }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/add-attachment`, {
      jsonrpc: '2.0',
      method: 'call',
      params: { ...params, attachment_type: params.attachment_type ?? 'supporting' },
      id: 1,
    });
    const result = response.data.result ?? response.data;
    return result as { success: boolean; data?: unknown; error?: string };
  },

  /**
   * Download document or specific version
   */
  downloadDocument: async (documentId: number, versionId?: number): Promise<Blob> => {
    const url = versionId
      ? `/api/documents/${documentId}/download?version_id=${versionId}`
      : `/api/documents/${documentId}/download`;
    
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get document blob for preview (doesn't trigger download)
   * Uses fetch API and creates blob from response to prevent automatic download
   * even when server sends Content-Disposition: attachment header
   */
  getDocumentForPreview: async (
    documentId: number,
    versionId?: number,
    fileName?: string
  ): Promise<Blob> => {
    const url = versionId
      ? `/api/documents/${documentId}/download?version_id=${versionId}&preview=1`
      : `/api/documents/${documentId}/download?preview=1`;
    
    // Use fetch API and read as arrayBuffer first, then create blob
    // This prevents browser from processing Content-Disposition headers
    const token = localStorage.getItem('access_token');
    const baseURL = import.meta.env.VITE_API_BASE_URL || '';
    const fullUrl = `${baseURL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': '*/*', // Accept any content type
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to fetch document for preview: ${response.statusText} - ${errorText}`);
    }

    // Read as arrayBuffer first to prevent browser from processing download headers
    const arrayBuffer = await response.arrayBuffer();

    // Determine content type
    const headerType = (response.headers.get('content-type') || '').toLowerCase();
    const ext = (fileName?.split('.').pop() || '').toLowerCase();

    const inferredType = (() => {
      // Prefer server-provided type when it's specific
      if (headerType && headerType !== 'application/octet-stream') return headerType;

      if (ext === 'pdf') return 'application/pdf';
      if (ext === 'png') return 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
      if (ext === 'gif') return 'image/gif';
      if (ext === 'webp') return 'image/webp';
      if (ext === 'bmp') return 'image/bmp';
      if (ext === 'svg') return 'image/svg+xml';

      return headerType || 'application/octet-stream';
    })();

    // Create blob from arrayBuffer - this bypasses Content-Disposition header processing
    // and sets a proper MIME type so the browser renders instead of downloading.
    const blob = new Blob([arrayBuffer], { type: inferredType });
    return blob;
  },

  /**
   * Archive document
   */
  archiveDocument: async (documentId: number): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/archive`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
    });
    const result = (response.data.result ?? response.data) as { success?: boolean; error?: string };
    if (result && result.success === false && result.error) {
      throw new Error(result.error);
    }
    return result as { success: boolean };
  },

  /**
   * Unarchive document
   */
  unarchiveDocument: async (documentId: number): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/unarchive`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
    });
    const result = (response.data.result ?? response.data) as { success?: boolean; error?: string };
    if (result && result.success === false && result.error) {
      throw new Error(result.error);
    }
    return result as { success: boolean };
  },

  /**
   * Move document to trash (soft delete)
   */
  trashDocument: async (
    documentId: number,
    reason?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/trash`, {
      jsonrpc: '2.0',
      method: 'call',
      params: reason ? { reason } : {},
    });
    const result = (response.data.result ?? response.data) as DeleteLikeResponse;
    if (result && result.success === false) {
      throw new Error(result.error || result.message || 'Failed to move document to trash');
    }
    return result as { success: boolean; message?: string };
  },

  /**
   * Restore document from trash
   */
  restoreDocument: async (documentId: number): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/restore`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
    });
    const result = (response.data.result ?? response.data) as DeleteLikeResponse;
    if (result && result.success === false) {
      throw new Error(result.error || result.message || 'Failed to restore document');
    }
    return result as { success: boolean; message?: string };
  },

  /**
   * List trashed documents
   */
  listTrashDocuments: async (params?: { page?: number; per_page?: number; search?: string }): Promise<TrashDocumentsResponse> => {
    const response = await apiClient.post(`/api/documents/trash`, {
      jsonrpc: '2.0',
      method: 'call',
      params: params || {},
    });
    const result = response.data.result || response.data;
    if (result && result.success === false) {
      throw new Error(result.error || result.message || "Failed to load trash");
    }
    return result as TrashDocumentsResponse;
  },

  /**
   * Permanently delete a document (admin only)
   */
  permanentDeleteDocument: async (
    documentId: number,
    confirmation?: string
  ): Promise<{ ok: true }> => {
    const response = await apiClient.delete(`/api/documents/${documentId}/permanent`, {
      data: confirmation ? { confirmation } : undefined,
    });
    const result = (response.data ?? {}) as DeleteLikeResponse;
    if (result && result.success === false) {
      throw new Error(result.error || result.message || 'Failed to permanently delete document');
    }
    if (result && (result.error || result.message) && result.success !== true) {
      throw new Error(result.error || result.message || 'Failed to permanently delete document');
    }
    return { ok: true };
  },

  /**
   * Get document versions
   */
  getVersions: async (documentId: number): Promise<{ success: boolean; data: DocumentVersion[] }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/versions`, {
      jsonrpc: '2.0',
      method: 'call',
      params: { document_id: documentId },
    });
    return response.data.result || response.data;
  },

  /**
   * List attachments for a document (NBS 8.1)
   */
  listAttachments: async (documentId: number): Promise<{ success: boolean; data: Attachment[] }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/attachments`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
      id: 1,
    });
    const result = response.data.result ?? response.data;
    return result as { success: boolean; data: Attachment[] };
  },

  /**
   * Download attachment (returns Blob)
   */
  downloadAttachment: async (documentId: number, attachmentId: number): Promise<Blob> => {
    const response = await apiClient.get(
      `/api/documents/${documentId}/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Get attachment blob for preview (fetch with token, arrayBuffer -> Blob to avoid download)
   */
  getAttachmentForPreview: async (
    documentId: number,
    attachmentId: number,
    fileName: string
  ): Promise<Blob> => {
    const url = `/api/documents/${documentId}/attachments/${attachmentId}/download?preview=1`;
    const token = localStorage.getItem('access_token');
    const baseURL = import.meta.env.VITE_API_BASE_URL || '';
    const fullUrl = `${baseURL}${url}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: '*/*',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to fetch attachment for preview: ${response.statusText} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const headerType = (response.headers.get('content-type') || '').toLowerCase();
    const ext = (fileName?.split('.').pop() || '').toLowerCase();

    const inferredType = (() => {
      if (headerType && headerType !== 'application/octet-stream') return headerType;
      if (ext === 'pdf') return 'application/pdf';
      if (ext === 'png') return 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
      if (ext === 'gif') return 'image/gif';
      if (ext === 'webp') return 'image/webp';
      if (ext === 'bmp') return 'image/bmp';
      if (ext === 'svg') return 'image/svg+xml';
      return headerType || 'application/octet-stream';
    })();

    return new Blob([arrayBuffer], { type: inferredType });
  },

  /**
   * Upload new version
   */
  uploadVersion: async (
    documentId: number,
    fileData: string,
    fileName: string,
    unlockToken: string,
    changeDescription: string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/upload-version`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        file_data: fileData,
        file_name: fileName,
        unlock_token: unlockToken,
        change_description: changeDescription,
      },
    });
    return response.data.result || response.data;
  },

  /**
   * Get document relations (parent + related documents)
   */
  getRelations: async (documentId: number): Promise<{
    success: boolean;
    data?: {
      parent?: { id: number; title: string; barcode?: string } | null;
      related?: Array<{ id: number; title: string; barcode?: string; relation_type?: string; notes?: string }>;
    };
  }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/relations`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
      id: 1,
    });
    return response.data.result ?? response.data;
  },

  /**
   * Add relation to another document
   */
  addRelation: async (
    documentId: number,
    params: { related_document_id: number; relation_type?: string; notes?: string }
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/add-relation`, {
      jsonrpc: '2.0',
      method: 'call',
      params,
      id: 1,
    });
    return response.data.result ?? response.data;
  },

  /**
   * Set or clear parent document
   */
  setParent: async (
    documentId: number,
    parentDocumentId: number | null
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/api/documents/${documentId}/set-parent`, {
      jsonrpc: '2.0',
      method: 'call',
      params: { parent_document_id: parentDocumentId },
      id: 1,
    });
    return response.data.result ?? response.data;
  },
};
