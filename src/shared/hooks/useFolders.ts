/**
 * useFolders — lightweight hook for listing folders.
 *
 * Lives in shared/hooks so dashboard (and any other feature) can consume it
 * without pulling in the full feature-folders chunk, which statically imports
 * feature-documents (FolderDetail side-panels).  The API call goes directly
 * through the adapter layer; feature-folders/services is just a re-export
 * of the same adapter functions, so there is no duplication.
 */

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { listFolders } from "../../app/adapter/api/folders.api";
import type {
  Folder,
  FolderListParams,
  FolderListResponse,
} from "../../app/adapter/api/folders.types";
import { queryKeys } from "../lib/queryKeys";

export type { Folder, FolderListParams, FolderListResponse };

const EMPTY_PARAMS: FolderListParams = {};
const EMPTY_FOLDERS: Folder[] = [];

interface UseFoldersOptions {
  useApi?: boolean;
  initialParams?: FolderListParams;
}

/** Fetches the folder list from the API; used on dashboard and folder list pages. */
export const useFolders = (options: UseFoldersOptions = {}) => {
  const { useApi = true, initialParams = EMPTY_PARAMS } = options;

  const query = useQuery({
    queryKey: queryKeys.folders.list(initialParams),
    queryFn: () => listFolders(initialParams),
    enabled: useApi,
  });
  const { refetch } = query;
  const fetchFolders = useCallback(() => refetch(), [refetch]);

  const folders = query.data?.folders ?? EMPTY_FOLDERS;
  const pagination = query.data?.pagination;
  const loading = query.isLoading;
  const error = query.isError
    ? query.error?.message || "Failed to load folders"
    : null;

  return {
    folders,
    loading,
    error,
    pagination,
    fetchFolders,
  };
};
