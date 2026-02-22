/**
 * useFolders — lightweight hook for listing folders.
 *
 * Lives in shared/hooks so dashboard (and any other feature) can consume it
 * without pulling in the full feature-folders chunk, which statically imports
 * feature-documents (FolderDetail side-panels).  The API call goes directly
 * through the adapter layer; feature-folders/services is just a re-export
 * of the same adapter functions, so there is no duplication.
 */

import { useState, useEffect, useCallback } from "react";
import { listFolders } from "../../app/adapter/api/folders.api";
import type {
  Folder,
  FolderListParams,
  FolderListResponse,
} from "../../app/adapter/api/folders.types";

export type { Folder, FolderListParams, FolderListResponse };

const EMPTY_PARAMS: FolderListParams = {};

interface UseFoldersOptions {
  useApi?: boolean;
  initialParams?: FolderListParams;
}

/** Fetches the folder list from the API; used on dashboard and folder list pages. */
export const useFolders = (options: UseFoldersOptions = {}) => {
  const { useApi = true, initialParams = EMPTY_PARAMS } = options;

  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] =
    useState<FolderListResponse["pagination"]>(undefined);

  // Destructure to primitives so fetchFolders reference stays stable between renders.
  const stateParam = initialParams.state;
  const departmentIdParam = initialParams.department_id;
  const folderTypeParam = initialParams.folder_type;
  const companyIdParam = initialParams.company_id;
  const pageParam = initialParams.page;
  const perPageParam = initialParams.per_page;
  const fromDateParam = initialParams.from_date;
  const toDateParam = initialParams.to_date;

  const fetchFolders = useCallback(
    async (params: FolderListParams = {}) => {
      try {
        setLoading(true);
        setError(null);
        const mergedParams: FolderListParams = {
          ...(stateParam !== undefined && { state: stateParam }),
          ...(departmentIdParam !== undefined && {
            department_id: departmentIdParam,
          }),
          ...(folderTypeParam !== undefined && {
            folder_type: folderTypeParam,
          }),
          ...(companyIdParam !== undefined && { company_id: companyIdParam }),
          ...(pageParam !== undefined && { page: pageParam }),
          ...(perPageParam !== undefined && { per_page: perPageParam }),
          ...(fromDateParam != null &&
            fromDateParam !== "" && { from_date: fromDateParam }),
          ...(toDateParam != null &&
            toDateParam !== "" && { to_date: toDateParam }),
          ...params,
        };
        let response: FolderListResponse;
        if (useApi) {
          try {
            response = await listFolders(mergedParams);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Failed to load folders",
            );
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
    [
      useApi,
      stateParam,
      departmentIdParam,
      folderTypeParam,
      companyIdParam,
      pageParam,
      perPageParam,
      fromDateParam,
      toDateParam,
    ],
  );

  /** Re-fetches when any list param changes (filter, pagination, date range). */
  useEffect(() => {
    fetchFolders();
  }, [
    useApi,
    stateParam,
    departmentIdParam,
    folderTypeParam,
    companyIdParam,
    pageParam,
    perPageParam,
    fromDateParam,
    toDateParam,
  ]);

  return {
    folders,
    loading,
    error,
    pagination,
    fetchFolders,
  };
};
