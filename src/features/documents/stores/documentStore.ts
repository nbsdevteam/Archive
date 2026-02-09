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
  archiveDocument: (documentId: number) => Promise<void>;
  unarchiveDocument: (documentId: number) => Promise<void>;
  trashDocument: (documentId: number, reason?: string) => Promise<void>;
  restoreDocument: (documentId: number) => Promise<void>;
  permanentDeleteDocument: (documentId: number, confirmation?: string) => Promise<void>;
  clearError: () => void;
  clearCurrentDocument: () => void;
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
    }
  },

  archiveDocument: async (documentId) => {
    set({ isLoading: true, error: null });

    try {
      await documentsApi.archiveDocument(documentId);

      // Refresh current document if it's the one we archived
      if (get().currentDocument?.id === documentId) {
        await get().fetchDocument(documentId);
      }
      await get().fetchDocuments();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: handleApiError(error),
        isLoading: false,
      });
      throw error;
    }
  },

  unarchiveDocument: async (documentId) => {
    set({ isLoading: true, error: null });

    try {
      await documentsApi.unarchiveDocument(documentId);
      if (get().currentDocument?.id === documentId) {
        await get().fetchDocument(documentId);
      }
      await get().fetchDocuments();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: handleApiError(error),
        isLoading: false,
      });
      throw error;
    }
  },

  trashDocument: async (documentId: number, reason?: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await documentsApi.trashDocument(documentId, reason);
      if (get().currentDocument?.id === documentId) {
        set({ currentDocument: null });
      }
      await get().fetchDocuments();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: handleApiError(error),
        isLoading: false,
      });
      throw error;
    }
  },

  restoreDocument: async (documentId: number): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await documentsApi.restoreDocument(documentId);
      if (get().currentDocument?.id === documentId) {
        await get().fetchDocument(documentId);
      }
      await get().fetchDocuments();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: handleApiError(error),
        isLoading: false,
      });
      throw error;
    }
  },

  permanentDeleteDocument: async (documentId: number, confirmation?: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await documentsApi.permanentDeleteDocument(documentId, confirmation);
      if (get().currentDocument?.id === documentId) {
        set({ currentDocument: null });
      }
      await get().fetchDocuments();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: handleApiError(error),
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  clearCurrentDocument: () => set({ currentDocument: null }),
}));
