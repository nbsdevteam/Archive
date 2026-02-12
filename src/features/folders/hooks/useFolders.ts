/**
 * useFolders - Hook for folders
 * Provides data fetching and state management for folders
 */

import { useState, useEffect, useCallback } from "react";
import * as foldersApi from "../services/folders.api";
import type { Folder, FolderListParams, FolderListResponse } from "../types/folders.types";

const EMPTY_PARAMS: FolderListParams = {};

interface UseFoldersOptions {
  useApi?: boolean;
  initialParams?: FolderListParams;
}

export const useFolders = (options: UseFoldersOptions = {}) => {
  const { useApi = true, initialParams = EMPTY_PARAMS } = options;

  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<FolderListResponse["pagination"]>(undefined);

  // Depend on primitive values so fetchFolders is stable when options don't change by value.
  // Inline objects like { state: "active" } are new references every render and would cause infinite loops.
  const stateParam = initialParams.state;
  const departmentIdParam = initialParams.department_id;
  const folderTypeParam = initialParams.folder_type;

  const fetchFolders = useCallback(
    async (params: FolderListParams = {}) => {
      try {
        setLoading(true);
        setError(null);
        const mergedParams: FolderListParams = {
          ...(stateParam !== undefined && { state: stateParam }),
          ...(departmentIdParam !== undefined && { department_id: departmentIdParam }),
          ...(folderTypeParam !== undefined && { folder_type: folderTypeParam }),
          ...params,
        };
        let response: FolderListResponse;
        if (useApi) {
          try {
            response = await foldersApi.listFolders(mergedParams);
          } catch (err) {
            console.error("Failed to fetch folders from API:", err);
            setError(err instanceof Error ? err.message : "Failed to load folders");
            setFolders([]);
            return;
          }
        } else {
          response = { folders: [] };
        }
        setFolders(response.folders || []);
        setPagination(response.pagination);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load folders");
        setFolders([]);
      } finally {
        setLoading(false);
      }
    },
    [useApi, stateParam, departmentIdParam, folderTypeParam]
  );

  /** Re-fetches folders on every mount so navigation back triggers a fresh API call. */
  useEffect(() => {
    fetchFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useApi, stateParam, departmentIdParam, folderTypeParam]);

  return {
    folders,
    loading,
    error,
    pagination,
    fetchFolders,
  };
};
