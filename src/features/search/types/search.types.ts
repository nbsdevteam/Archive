/**
 * Search feature types
 * Based on API_DOCUMENTATION.md
 */

export interface SearchResult {
  id: number;
  document_id?: number;
  entity_type: "document" | "folder";
  title?: string;
  name?: string;
  department_name?: string;
  department?: { name?: string };
  status?: string;
  barcode?: string;
  document_type_name?: string;
  document_type?: { name?: string };
  upload_date?: string;
  created_at?: string;
}

export interface SearchParams {
  query: string;
  search_in_content?: boolean;
  fuzzy?: boolean;
  page?: number;
  per_page?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  took_ms?: number;
}
