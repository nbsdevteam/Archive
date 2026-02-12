import apiClient from './client';

export interface SearchResult {
  id: number;
  type?: 'document' | 'folder' | 'note';
  /** API may return entity_type instead of type */
  entity_type?: string;
  title?: string;
  name?: string;
  code?: string;
  barcode?: string;
  department_name?: string;
  document_type_name?: string;
  upload_date?: string;
  created_at?: string;
  create_date?: string;
  // Note-specific fields
  content?: string;
  user_name?: string;
  document_id?: number | null;
  document_title?: string | null;
  folder_id?: number | null;
  folder_name?: string | null;
  has_image?: boolean;
  is_pinned?: boolean;
  color?: number;
  updated_at?: string;
}

export interface SearchResponse {
  success: boolean;
  data: SearchResult[];
  pagination?: {
    total: number;
    page: number;
    per_page: number;
  };
}

export const searchApi = {
  /**
   * General search
   */
  search: async (params: {
    query: string;
    search_in_content?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<SearchResponse> => {
    const response = await apiClient.post('/api/search', {
      jsonrpc: '2.0',
      method: 'call',
      params,
    });
    return response.data.result || response.data;
  },

  /**
   * Global search
   */
  globalSearch: async (params: {
    query: string;
    search_in_content?: boolean;
    fuzzy?: boolean;
  }): Promise<SearchResponse> => {
    const response = await apiClient.post('/api/search/global', {
      jsonrpc: '2.0',
      method: 'call',
      params,
    });
    return response.data.result || response.data;
  },

  /**
   * Barcode search
   */
  searchByBarcode: async (barcode: string): Promise<SearchResponse> => {
    const response = await apiClient.post('/api/search/barcode', {
      jsonrpc: '2.0',
      method: 'call',
      params: { barcode },
    });
    return response.data.result || response.data;
  },
};
