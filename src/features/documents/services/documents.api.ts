/**
 * Documents API module
 * Direct API calls based on API_DOCUMENTATION.md
 * Uses JSON-RPC 2.0
 */

import { jsonRpcRequest } from "../../../shared/lib/http";
import type { Document, DocumentListParams, DocumentListResponse } from "../types/documents.types";

/**
 * List documents
 * POST /api/documents (type=jsonrpc)
 */
export const listDocuments = async (
  params: DocumentListParams = {}
): Promise<DocumentListResponse> => {
  const result = await jsonRpcRequest<DocumentListResponse | Document[] | { data: Document[]; pagination?: any }>(
    "/api/documents",
    {
      department_id: params.department_id,
      document_type_id: params.document_type_id,
      status: params.status || "active",
      search: params.search,
      page: params.page || 1,
      per_page: params.per_page || 20,
    }
  );

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { documents: result as Document[] };
  }
  if (typeof result === "object" && "documents" in result) {
    return result as DocumentListResponse;
  }
  if (typeof result === "object" && "data" in result) {
    const dataResult = result as { data: Document[]; pagination?: any };
    return {
      documents: dataResult.data,
      pagination: dataResult.pagination,
    };
  }
  return { documents: [] };
};
