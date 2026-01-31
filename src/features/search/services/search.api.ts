/**
 * Search API module
 * Direct API calls based on API_DOCUMENTATION.md
 * All endpoints use JSON-RPC 2.0
 */

import { jsonRpcRequest } from "../../../shared/lib/http";
import type {
  SearchResult,
  SearchParams,
  SearchResponse,
} from "../types/search.types";

/**
 * Search documents and folders
 * POST /api/search (type=jsonrpc)
 */
export const search = async (
  params: SearchParams
): Promise<SearchResponse> => {
  const result = await jsonRpcRequest<SearchResponse>(
    "/api/search",
    {
      query: params.query,
      search_in_content: params.search_in_content || false,
      fuzzy: params.fuzzy || false,
      page: params.page || 1,
      per_page: params.per_page || 20,
    }
  );

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { results: result as SearchResult[] };
  }
  if (typeof result === "object" && "results" in result) {
    return result as SearchResponse;
  }
  return { results: [] };
};

/**
 * Global search
 * POST /api/search/global (type=jsonrpc)
 */
export const globalSearch = async (
  params: SearchParams
): Promise<SearchResponse> => {
  const result = await jsonRpcRequest<SearchResponse>(
    "/api/search/global",
    {
      query: params.query,
      search_in_content: params.search_in_content || false,
      fuzzy: params.fuzzy || false,
      page: params.page || 1,
      per_page: params.per_page || 20,
    }
  );

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { results: result as SearchResult[] };
  }
  if (typeof result === "object" && "results" in result) {
    return result as SearchResponse;
  }
  return { results: [] };
};

/**
 * Search by barcode
 * POST /api/search/barcode (type=jsonrpc)
 */
export const searchByBarcode = async (
  barcode: string
): Promise<SearchResponse> => {
  const result = await jsonRpcRequest<SearchResponse>(
    "/api/search/barcode",
    {
      barcode: barcode,
    }
  );

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { results: result as SearchResult[] };
  }
  if (typeof result === "object" && "results" in result) {
    return result as SearchResponse;
  }
  return { results: [] };
};
