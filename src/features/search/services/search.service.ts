/**
 * Search Service Layer
 * Orchestrates API calls and provides static data fallback
 */

import * as searchApi from "./search.api";
import type {
  SearchResult,
  SearchParams,
  SearchResponse,
} from "../types/search.types";

/**
 * Search (with static fallback)
 */
export const search = async (
  params: SearchParams,
  useApi: boolean = false
): Promise<SearchResponse> => {
  if (useApi) {
    return searchApi.search(params);
  }

  // Static mock data based on query
  const query = params.query?.toLowerCase() || "";
  const mockResults: SearchResult[] = [];

  if (query.includes("invoice") || query.includes("inv")) {
    mockResults.push({
      id: 1,
      document_id: 1,
      entity_type: "document",
      title: "Invoice_2024_Q1.xlsx",
      name: "Invoice_2024_Q1.xlsx",
      department_name: "Finance",
      status: "active",
      barcode: "INV-2024-Q1",
      created_at: new Date().toISOString(),
    });
  }

  if (query.includes("legal") || query.includes("folder")) {
    mockResults.push({
      id: 2,
      entity_type: "folder",
      name: "Legal / Compliance",
      title: "Legal / Compliance",
      department_name: "Legal",
      status: "active",
      created_at: new Date().toISOString(),
    });
  }

  return {
    results: mockResults,
    pagination: {
      page: params.page || 1,
      per_page: params.per_page || 20,
      total: mockResults.length,
      total_pages: 1,
    },
    took_ms: 50,
  };
};

/**
 * Global search
 */
export const globalSearch = async (
  params: SearchParams,
  useApi: boolean = false
): Promise<SearchResponse> => {
  if (useApi) {
    return searchApi.globalSearch(params);
  }

  // Use same mock as regular search
  return search(params, false);
};

/**
 * Search by barcode
 */
export const searchByBarcode = async (
  barcode: string,
  useApi: boolean = false
): Promise<SearchResponse> => {
  if (useApi) {
    return searchApi.searchByBarcode(barcode);
  }

  // Static mock data
  return {
    results: [
      {
        id: 1,
        document_id: 1,
        entity_type: "document",
        title: `Document with barcode ${barcode}`,
        name: `Document_${barcode}.pdf`,
        department_name: "Finance",
        status: "active",
        barcode: barcode,
        created_at: new Date().toISOString(),
      },
    ],
  };
};
