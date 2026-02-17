/**
 * Countries store – fetches from POST /api/countries (jsonrpc) for company create/edit dropdown.
 * Fetched once when Create Company is opened; cached for the session.
 */

import { create } from "zustand";
import { handleApiError } from "../../app/adapter/api/client";
import { listCountries } from "@/features/companies/services/companies.api";
import type { ApiCountryRow } from "@/features/companies/services/companies.api";

export interface FetchCountriesParams {
  search?: string;
  limit?: number;
}

interface CountriesState {
  countries: ApiCountryRow[];
  count: number | undefined;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  fetchCountries: (params?: FetchCountriesParams) => Promise<void>;
  clearCountries: () => void;
  clearError: () => void;
}

export const useCountriesStore = create<CountriesState>((set, get) => ({
  countries: [],
  count: undefined,
  isLoading: false,
  isInitialized: false,
  error: null,

  /**
   * Fetches countries from POST /api/countries. Skips if already loading.
   * Pass params (e.g. limit) to fetch; cache is used when already initialized and no params.
   */
  fetchCountries: async (params?: FetchCountriesParams): Promise<void> => {
    const state = get();
    if (state.isLoading) return;
    const skipCache = params && (params.search !== undefined || params.limit !== undefined);
    if (!skipCache && state.isInitialized && state.countries.length > 0) return;

    set({ isLoading: true, error: null });

    try {
      const { data, count } = await listCountries({
        search: params?.search,
        limit: params?.limit ?? 300,
      });
      set({
        countries: data,
        count,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error("Failed to fetch countries:", error);
      set({
        countries: [],
        count: undefined,
        error: handleApiError(error),
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  clearCountries: () =>
    set({
      countries: [],
      count: undefined,
      isInitialized: false,
      error: null,
    }),

  clearError: () => set({ error: null }),
}));
