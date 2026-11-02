import { create } from 'zustand';
import { signaturesApi, SignatureRequest } from '../../../app/adapter/api/signatures.api';
import { handleApiError } from '../../../app/adapter/api/client';
import { queryClient } from '../../../shared/lib/queryClient';
import { queryKeys } from '../../../shared/lib/queryKeys';

const invalidateSignatures = () => queryClient.invalidateQueries({ queryKey: queryKeys.signatures.all });

interface SignatureState {
  requests: SignatureRequest[];
  isLoading: boolean;
  error: string | null;

  fetchRequests: (params?: { state?: string; document_id?: number }) => Promise<void>;
  createRequest: (params: {
    document_id: number;
    signer_id: number;
    message?: string;
  }) => Promise<number>;
  approve: (request_id: number) => Promise<{ sign_token: string; expires_at?: string }>;
  reject: (request_id: number, rejection_reason?: string) => Promise<void>;
  uploadSigned: (
    request_id: number,
    params: { file_data: string; file_name: string; sign_token: string; notes?: string }
  ) => Promise<any>;
}

export const useSignatureStore = create<SignatureState>((set) => ({
  requests: [],
  isLoading: false,
  error: null,

  fetchRequests: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const listParams = { ...(params || {}), page: 1, per_page: 50 };
      const resp = await queryClient.fetchQuery({
        queryKey: queryKeys.signatures.list(listParams),
        queryFn: () => signaturesApi.list(listParams),
      });
      set({ requests: resp.data || [], isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), requests: [], isLoading: false });
    }
  },

  createRequest: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await signaturesApi.create(params);
      void invalidateSignatures();
      set({ isLoading: false });
      return resp.data?.id;
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  approve: async (request_id) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await signaturesApi.approve(request_id);
      void invalidateSignatures();
      set({ isLoading: false });
      return resp.data;
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  reject: async (request_id, rejection_reason) => {
    set({ isLoading: true, error: null });
    try {
      await signaturesApi.reject(request_id, rejection_reason);
      void invalidateSignatures();
      set({ isLoading: false });
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },

  uploadSigned: async (request_id, params) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await signaturesApi.uploadSigned(request_id, params);
      void invalidateSignatures();
      set({ isLoading: false });
      return resp.data;
    } catch (e) {
      set({ error: handleApiError(e), isLoading: false });
      throw e;
    }
  },
}));
