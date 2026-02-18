import { create } from 'zustand';
import {
  documentsApi,
  type Document,
  type DocumentDetail,
  type GetDocumentsParams,
  type UploadDocumentRequest,
} from '../../../app/adapter/api/documents.api';
import { handleApiError } from '../../../app/adapter/api/client';
import { downloadBlobAsFile } from '../../../shared/utils/files/downloadBlobAsFile';

interface DocumentState {
  documents: Document[];
  currentDocument: DocumentDetail | null;
  isLoading: boolean;
  isDownloading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };

  // Actions
  fetchDocuments: (params?: GetDocumentsParams) => Promise<void>;
  fetchDocument: (id: number) => Promise<void>;
  uploadDocument: (data: UploadDocumentRequest) => Promise<number>;
  uploadVersion: (
    documentId: number,
    data: { file_data: string; file_name: string; unlock_token: string; change_description: string }
  ) => Promise<void>;
  downloadVersion: (documentId: number, versionId: number, fileName: string) => Promise<void>;
  archiveDocument: (documentIds: number | number[]) => Promise<void>;
  unarchiveDocument: (documentIds: number | number[]) => Promise<void>;
  trashDocument: (documentIds: number | number[], reason?: string) => Promise<void>;
  restoreDocument: (documentIds: number | number[]) => Promise<{ restored: number[]; failed: number[] }>;
  permanentDeleteDocuments: (documentIds: number[]) => Promise<void>;
  clearError: () => void;
  clearCurrentDocument: () => void;
  /** Hydrate current document from prefetched route state without calling the API. */
  setCurrentDocument: (doc: DocumentDetail | null) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentDocument: null,
  isLoading: false,
  isDownloading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    per_page: 20,
    total_pages: 0,
  },

  fetchDocuments: async (params?: GetDocumentsParams): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      const response = await documentsApi.getDocuments(params);

      set({
        documents: response?.data || [],
        pagination: response?.pagination || { total: 0, page: 1, per_page: 20, total_pages: 0 },
        isLoading: false,
      });
    } catch (error) {
      console.error('Fetch documents error:', error);
      set({
        documents: [], // Set empty array on error
        error: handleApiError(error),
        isLoading: false,
      });
    }
  },

  fetchDocument: async (id: number): Promise<void> => {
    if (!id || isNaN(id)) {
      console.error('Invalid document ID:', id);
      set({ error: 'Invalid document ID', isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await documentsApi.getDocument(id);

      set({
        currentDocument: response?.data || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Fetch document error:', error);
      set({
        currentDocument: null,
        error: handleApiError(error),
        isLoading: false,
      });
    }
  },

  uploadDocument: async (data: UploadDocumentRequest): Promise<number> => {
    set({ isLoading: true, error: null });

    try {
      const response = await documentsApi.uploadDocument(data);

      set({ isLoading: false });

      return response.data.id;
    } catch (error) {
      set({
        error: handleApiError(error),
        isLoading: false,
      });
      throw error;
    }
  },

  uploadVersion: async (
    documentId: number,
    data: { file_data: string; file_name: string; unlock_token: string; change_description: string }
  ): Promise<void> => {
    set({ isLoading: true, error: null });

    try {
      await documentsApi.uploadVersion(
        documentId,
        data.file_data,
        data.file_name,
        data.unlock_token,
        data.change_description
      );

      // Refresh document details
      await get().fetchDocument(documentId);

      set({ isLoading: false });
    } catch (error) {
      set({
        error: handleApiError(error),
        isLoading: false,
      });
      throw error;
    }
  },

  downloadVersion: async (documentId, versionId, fileName) => {
    const state = get();
    // Prevent double downloads - check if already downloading
    if (state.isDownloading) {
      return;
    }

    // IMPORTANT: do NOT toggle isLoading here — it controls page skeletons
    // and would cause the page to "reload"/remount and re-trigger preview.
    set({ isDownloading: true, error: null });

    try {
      const blob = await documentsApi.downloadDocument(documentId, versionId);

      // Small delay to avoid UI jank in some browsers.
      setTimeout(() => downloadBlobAsFile(blob, fileName), 10);

      set({ isDownloading: false });
    } catch (error) {
      set({
        error: handleApiError(error),
        isDownloading: false,
      });
      throw error;
    }
  },

  archiveDocument: async (documentIds): Promise<void> => {
    const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
    if (ids.length === 0) return;
    set({ error: null });
    try {
      await documentsApi.archiveDocument(ids);
      const currentId = get().currentDocument?.id;
      if (currentId && ids.includes(currentId)) {
        await get().fetchDocument(currentId);
      }
      await get().fetchDocuments();
    } catch (error) {
      set({ error: handleApiError(error) });
      throw error;
    }
  },

  unarchiveDocument: async (documentIds) => {
    const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
    if (ids.length === 0) return;
    set({ error: null });
    try {
      await documentsApi.unarchiveDocument(ids);
      const currentId = get().currentDocument?.id;
      if (currentId && ids.includes(currentId)) {
        await get().fetchDocument(currentId);
      }
      await get().fetchDocuments();
    } catch (error) {
      set({ error: handleApiError(error) });
      throw error;
    }
  },

  trashDocument: async (documentIds: number | number[], reason?: string): Promise<void> => {
    const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
    if (ids.length === 0) return;
    set({ error: null });
    try {
      await documentsApi.trashDocument(ids, reason);
      const currentId = get().currentDocument?.id;
      if (currentId && ids.includes(currentId)) {
        set({ currentDocument: null });
      }
      await get().fetchDocuments();
    } catch (error) {
      set({ error: handleApiError(error) });
      throw error;
    }
  },

  /** Restores selected documents in one API call; returns { restored, failed }. Refetches only when any restored. */
  restoreDocument: async (documentIds: number | number[]): Promise<{ restored: number[]; failed: number[] }> => {
    const ids = Array.isArray(documentIds) ? documentIds : [documentIds];
    if (ids.length === 0) return { restored: [], failed: [] };
    set({ error: null });
    try {
      const result = await documentsApi.restoreDocument(ids);
      if (result.restored.length > 0) {
        const currentId = get().currentDocument?.id;
        if (currentId && result.restored.includes(currentId)) {
          await get().fetchDocument(currentId);
        }
        await get().fetchDocuments();
      }
      return result;
    } catch (error) {
      set({ error: handleApiError(error) });
      throw error;
    }
  },

  /** Permanently deletes selected documents in one API call and refreshes list state. */
  permanentDeleteDocuments: async (documentIds: number[]): Promise<void> => {
    if (documentIds.length === 0) return;
    set({ error: null });
    try {
      await documentsApi.permanentDeleteDocuments(documentIds);
      const current = get().currentDocument;
      if (current != null && documentIds.includes(current.id)) {
        set({ currentDocument: null });
      }
      await get().fetchDocuments();
    } catch (error) {
      set({ error: handleApiError(error) });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  clearCurrentDocument: () => set({ currentDocument: null }),

  setCurrentDocument: (doc) => set({ currentDocument: doc, error: null }),
}));
