import apiClient from './client';

export interface OcrTestResponse {
  success: boolean;
  data: {
    provider: string;
    key_configured: boolean;
  };
}

export interface OcrBackfillResult {
  document_id: number;
  name: string;
  success: boolean;
  chars?: number;
  error?: string;
}

export interface OcrBackfillResponse {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  remaining: number;
  results: OcrBackfillResult[];
}

/**
 * Run OCR on a document
 * POST /api/ocr/run/<document_id> (type=jsonrpc)
 */
export const ocrApi = {
  runOcr: async (documentId: number): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/api/ocr/run/${documentId}`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
      id: 1,
    });
    return response.data.result ?? response.data;
  },

  /**
   * Test OCR provider configuration
   * POST /api/ocr/test (type=jsonrpc)
   */
  testOcr: async (): Promise<OcrTestResponse> => {
    const response = await apiClient.post('/api/ocr/test', {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
      id: 1,
    });
    return response.data.result ?? response.data;
  },

  /**
   * Backfill OCR for documents without extracted text
   * POST /api/ocr/backfill (type=jsonrpc)
   */
  backfillOcr: async (limit: number = 50): Promise<OcrBackfillResponse> => {
    const response = await apiClient.post('/api/ocr/backfill', {
      jsonrpc: '2.0',
      method: 'call',
      params: { limit },
      id: 1,
    });
    return response.data.result ?? response.data;
  },
};
