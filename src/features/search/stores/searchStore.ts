import { create } from 'zustand';
import { searchApi } from '../../../app/adapter/api/search.api';
import { handleApiError } from '../../../app/adapter/api/client';
import { queryClient } from '../../../shared/lib/queryClient';
import { queryKeys } from '../../../shared/lib/queryKeys';
import type { SearchResult } from '../types/search.types';

interface SearchState {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    per_page: number;
  } | null;

  // Actions
  search: (params: { query: string; search_in_content?: boolean; page?: number; per_page?: number }) => Promise<void>;
  globalSearch: (params: { query: string; search_in_content?: boolean; fuzzy?: boolean; page?: number; per_page?: number }) => Promise<void>;
  searchByBarcode: (barcode: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  results: [],
  isLoading: false,
  error: null,
  pagination: null,

  search: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await queryClient.fetchQuery({
        queryKey: queryKeys.search.results('standard', params),
        queryFn: () => searchApi.search(params),
      });
      set({
        results: (response.data ?? []) as SearchResult[],
        pagination: response.pagination || null,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: handleApiError(error),
        results: [],
        isLoading: false,
      });
    }
  },

  globalSearch: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await queryClient.fetchQuery({
        queryKey: queryKeys.search.results('global', params),
        queryFn: () => searchApi.globalSearch(params),
      });
      set({
        results: (response.data ?? []) as SearchResult[],
        pagination: response.pagination || null,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        error: handleApiError(error),
        results: [],
        isLoading: false,
      });
    }
  },

  searchByBarcode: async (barcode) => {
    set({ isLoading: true, error: null });
    try {
      const response = await queryClient.fetchQuery({
        queryKey: queryKeys.search.results('barcode', barcode),
        queryFn: () => searchApi.searchByBarcode(barcode),
      });
      if (response.data && response.data.length > 0) {
        set({
          results: response.data as SearchResult[],
          pagination: response.pagination || null,
          isLoading: false,
        });
      } else {
        set({
          results: [],
          pagination: null,
          isLoading: false,
        });
      }
    } catch (error: unknown) {
      set({
        error: handleApiError(error),
        results: [],
        isLoading: false,
      });
    }
  },

  clearResults: () => set({ results: [], pagination: null }),

  clearError: () => set({ error: null }),
}));
