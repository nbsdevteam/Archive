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
  const companyIdParam = initialParams.company_id;
  const pageParam = initialParams.page;
  const perPageParam = initialParams.per_page;

  const fetchFolders = useCallback(
    async (params: FolderListParams = {}) => {
      try {
        setLoading(true);
        setError(null);
        const mergedParams: FolderListParams = {
          ...(stateParam !== undefined && { state: stateParam }),
          ...(departmentIdParam !== undefined && { department_id: departmentIdParam }),
          ...(folderTypeParam !== undefined && { folder_type: folderTypeParam }),
          ...(companyIdParam !== undefined && { company_id: companyIdParam }),
          ...(pageParam !== undefined && { page: pageParam }),
          ...(perPageParam !== undefined && { per_page: perPageParam }),
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
    [useApi, stateParam, departmentIdParam, folderTypeParam, companyIdParam, pageParam, perPageParam]
  );

  /** Re-fetches folders when list params change (e.g. filter, pagination). */
  useEffect(() => {
    fetchFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useApi, stateParam, departmentIdParam, folderTypeParam, companyIdParam, pageParam, perPageParam]);

  return {
    folders,
    loading,
    error,
    pagination,
    fetchFolders,
  };
};
