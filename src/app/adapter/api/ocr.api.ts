import apiClient from './client';

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
};
