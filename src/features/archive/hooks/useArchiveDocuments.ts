/**
 * useArchiveDocuments - Hook for archive documents
 * Provides data fetching and state management for documents
 */

import { useState, useEffect } from "react";
import * as archiveApi from "../services/archive.api";
import { staticDocuments } from "../utils/archiveUtils";
import type { Document, DocumentListParams, DocumentListResponse } from "../types/archive.types";

interface UseArchiveDocumentsOptions {
  useApi?: boolean;
  params?: DocumentListParams;
}

/**
 * Hook for archive documents
 * Provides documents data with static fallback by default
 */
export const useArchiveDocuments = (options: UseArchiveDocumentsOptions = {}) => {
  const { useApi = false, params = {} } = options;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        let response: DocumentListResponse;
        if (useApi) {
          try {
            response = await archiveApi.listDocuments(params);
          } catch (err) {
            console.error("Failed to fetch documents from API:", err);
            // Fall back to static data on error
            response = { documents: staticDocuments };
          }
        } else {
          response = { documents: staticDocuments };
        }
        setDocuments(response.documents);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [useApi, params.department_id, params.document_type_id, params.status, params.search]);

  return {
    documents,
    loading,
    error,
  };
};
