/**
 * Departments Store - Centralized store for departments data
 * Fetches departments only once and caches the result to prevent duplicate API calls
 */

import { useEffect } from 'react';
import { create } from 'zustand';
import { adminApi } from '../../app/adapter/api/admin.api';
import { handleApiError } from '../../app/adapter/api/client';

export interface Department {
  id: number;
  name: string;
  code: string;
}

interface DepartmentsState {
  departments: Department[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  fetchDepartments: () => Promise<void>;
  clearDepartments: () => void;
  clearError: () => void;
}

export const useDepartmentsStore = create<DepartmentsState>((set, get) => ({
  departments: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  /**
   * Fetches departments from API, but only if not already fetched
   * This ensures departments are loaded once on login and reused everywhere
   */
  fetchDepartments: async (): Promise<void> => {
    const state = get();
    
    // Skip if already loading or already initialized with data
    if (state.isLoading || (state.isInitialized && state.departments.length > 0)) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await adminApi.getDepartments();
      
      set({
        departments: response?.data || [],
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      set({
        departments: [],
        error: handleApiError(error),
        isLoading: false,
        isInitialized: true, // Mark as initialized even on error to prevent retries
      });
    }
  },

  /**
   * Clears departments data (useful on logout)
   */
  clearDepartments: () => {
    set({
      departments: [],
      isInitialized: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

/**
 * Hook to use departments from the centralized store
 * Automatically fetches on first use if not already loaded
 */
export const useDepartments = () => {
  const { departments, isLoading, error, fetchDepartments } = useDepartmentsStore();

  // Auto-fetch on first use if not initialized
  useEffect(() => {
    if (!useDepartmentsStore.getState().isInitialized) {
      fetchDepartments();
    }
  }, [fetchDepartments]);

  return { departments, isLoading, error };
};
