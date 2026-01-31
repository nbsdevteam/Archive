/**
 * useArchiveUpload - Hook for document upload
 * Handles upload logic with static fallback by default
 */

import { useState } from "react";
import * as archiveApi from "../services/archive.api";
import type { UploadDocumentParams, Document } from "../types/archive.types";

interface UseArchiveUploadOptions {
  useApi?: boolean;
}

export const useArchiveUpload = (options: UseArchiveUploadOptions = {}) => {
  const { useApi = false } = options;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null);

  const handleUpload = async (params: UploadDocumentParams) => {
    setUploading(true);
    setError(null);
    setUploadedDocument(null);

    try {
      let result;
      if (useApi) {
        result = await archiveApi.uploadDocument(params);
      } else {
        // Static mode: simulate success
        result = {
          success: true,
          document: {
            name: params.file_name,
            type: params.file_name.split(".").pop() || "File",
            updated: "Just now",
          } as Document,
        };
      }

      if (result.success) {
        const doc = 'document' in result ? result.document : result.data;
        if (doc) {
          setUploadedDocument(doc);
        }
        return result;
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    handleUpload,
    uploading,
    error,
    uploadedDocument,
  };
};
