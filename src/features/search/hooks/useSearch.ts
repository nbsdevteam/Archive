/**
 * useSearch - Hook for search
 * Provides data fetching and state management for search
 */

import { useState, useCallback } from "react";
import * as searchService from "../services/search.service";
import type { SearchResult, SearchParams, SearchResponse } from "../types/search.types";

interface UseSearchOptions {
  useApi?: boolean;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const { useApi = false } = options;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<SearchResponse["pagination"]>(undefined);
  const [tookMs, setTookMs] = useState<number | undefined>(undefined);

  const search = useCallback(
    async (query: string, params: Partial<SearchParams> = {}, page: number = 1) => {
      if (!query.trim()) {
        setResults([]);
        setPagination(undefined);
        setTookMs(undefined);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await searchService.search(
          {
            query: query.trim(),
            page,
            per_page: params.per_page || 20,
            search_in_content: params.search_in_content,
            fuzzy: params.fuzzy,
          },
          useApi
        );
        setResults(response.results || []);
        setPagination(response.pagination);
        setTookMs(response.took_ms);
      } catch (err: any) {
        setError(err?.message || "Failed to perform search");
        setResults([]);
        setPagination(undefined);
        setTookMs(undefined);
      } finally {
        setLoading(false);
      }
    },
    [useApi]
  );

  const globalSearch = useCallback(
    async (query: string, params: Partial<SearchParams> = {}, page: number = 1) => {
      if (!query.trim()) {
        setResults([]);
        setPagination(undefined);
        setTookMs(undefined);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await searchService.globalSearch(
          {
            query: query.trim(),
            page,
            per_page: params.per_page || 20,
            search_in_content: params.search_in_content,
            fuzzy: params.fuzzy,
          },
          useApi
        );
        setResults(response.results || []);
        setPagination(response.pagination);
        setTookMs(response.took_ms);
      } catch (err: any) {
        setError(err?.message || "Failed to perform global search");
        setResults([]);
        setPagination(undefined);
        setTookMs(undefined);
      } finally {
        setLoading(false);
      }
    },
    [useApi]
  );

  const searchByBarcode = useCallback(
    async (barcode: string) => {
      if (!barcode.trim()) {
        setResults([]);
        setPagination(undefined);
        setTookMs(undefined);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await searchService.searchByBarcode(barcode.trim(), useApi);
        setResults(response.results || []);
        setPagination(response.pagination);
        setTookMs(response.took_ms);
      } catch (err: any) {
        setError(err?.message || "Failed to search by barcode");
        setResults([]);
        setPagination(undefined);
        setTookMs(undefined);
      } finally {
        setLoading(false);
      }
    },
    [useApi]
  );

  return {
    results,
    loading,
    error,
    pagination,
    tookMs,
    search,
    globalSearch,
    searchByBarcode,
  };
};
