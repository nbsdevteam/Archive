/**
 * Companies (brands) store – fetches from POST /api/companies for dropdowns and filters.
 * Caches result to avoid duplicate calls; optional search/limit for future use.
 */

import { useEffect } from "react";
import { create } from "zustand";
import { jsonRpcRequest } from "../lib/http";
import { handleApiError } from "../../app/adapter/api/client";
import type { Company, CompaniesResponse } from "../types/company";

export interface FetchCompaniesParams {
  search?: string;
  limit?: number;
}

interface CompaniesState {
  companies: Company[];
  count: number | undefined;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  fetchCompanies: (params?: FetchCompaniesParams) => Promise<void>;
  clearCompanies: () => void;
  clearError: () => void;
}

/** Normalizes API result to { data, count } (handles success/data wrapper). */
function normalizeCompaniesResult(
  raw: CompaniesResponse | Company[] | { success?: boolean; data?: Company[]; count?: number }
): { data: Company[]; count?: number } {
  if (Array.isArray(raw)) return { data: raw };
  if (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as CompaniesResponse).data)) {
    const r = raw as CompaniesResponse;
    return { data: r.data, count: r.count };
  }
  return { data: [] };
}

export const useCompaniesStore = create<CompaniesState>((set, get) => ({
  companies: [],
  count: undefined,
  isLoading: false,
  isInitialized: false,
  error: null,

  /**
   * Fetches companies from POST /api/companies. Skips if already loading or
   * already initialized with data; pass params to force refetch or use search/limit.
   */
  fetchCompanies: async (params?: FetchCompaniesParams): Promise<void> => {
    const state = get();
    const skipCache = params && (params.search !== undefined || params.limit !== undefined);
    if (state.isLoading) return;
    if (!skipCache && state.isInitialized && state.companies.length > 0) return;

    set({ isLoading: true, error: null });

    try {
      const payload: Record<string, unknown> = {};
      if (params?.search != null) payload.search = params.search;
      if (params?.limit != null) payload.limit = params.limit;
      const result = await jsonRpcRequest<CompaniesResponse | Company[] | { success?: boolean; data?: Company[]; count?: number }>(
        "/api/companies",
        payload
      );
      const { data, count } = normalizeCompaniesResult(result);
      set({
        companies: data,
        count,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      set({
        companies: [],
        count: undefined,
        error: handleApiError(error),
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /** Clears companies data (e.g. on logout). */
  clearCompanies: () =>
    set({
      companies: [],
      count: undefined,
      isInitialized: false,
      error: null,
    }),

  clearError: () => set({ error: null }),
}));

/**
 * Hook that exposes companies and auto-fetches once when not yet initialized.
 */
export const useCompanies = () => {
  const { companies, isLoading, error, fetchCompanies } = useCompaniesStore();
  useEffect(() => {
    if (!useCompaniesStore.getState().isInitialized) {
      fetchCompanies({ limit: 100 });
    }
  }, [fetchCompanies]);
  return { companies, isLoading, error };
};
