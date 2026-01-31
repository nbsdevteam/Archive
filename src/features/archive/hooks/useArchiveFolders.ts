/**
 * useArchiveFolders - Hook for archive folders
 * Provides data fetching and state management for folders
 */

import { useState, useEffect } from "react";
import * as archiveApi from "../services/archive.api";
import { staticFolders } from "../utils/archiveUtils";
import type { Folder, FolderListParams, FolderListResponse } from "../types/archive.types";

interface UseArchiveFoldersOptions {
  useApi?: boolean;
  params?: FolderListParams;
}

export const useArchiveFolders = (options: UseArchiveFoldersOptions = {}) => {
  const { useApi = false, params = {} } = options;
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      setLoading(true);
      setError(null);
      try {
        let response: FolderListResponse;
        if (useApi) {
          try {
            response = await archiveApi.listFolders(params);
          } catch (err) {
            console.error("Failed to fetch folders from API:", err);
            response = { folders: staticFolders };
          }
        } else {
          response = { folders: staticFolders };
        }
        setFolders(response.folders);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load folders");
        setFolders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, [useApi, params.department_id, params.folder_type, params.state]);

  return {
    folders,
    loading,
    error,
  };
};
