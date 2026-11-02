import { adminApi } from "../../app/adapter/api/admin.api";
import { listFolders } from "../../app/adapter/api/folders.api";
import type { FolderListParams } from "../../app/adapter/api/folders.types";
import { queryClient, REFERENCE_STALE_TIME_MS } from "./queryClient";
import { queryKeys } from "./queryKeys";

/**
 * Cached lookups for code that fetches imperatively (zustand stores, side panels opening). These
 * share cache entries with useQuery hooks using the same keys, so the response shape must not vary.
 */

export const documentTypesQuery = (departmentId: number) => ({
  queryKey: queryKeys.reference.documentTypes(departmentId),
  queryFn: () => adminApi.getDocumentTypes(departmentId),
  staleTime: REFERENCE_STALE_TIME_MS,
});

export const fetchDepartmentsCached = () =>
  queryClient.fetchQuery({
    queryKey: queryKeys.reference.departments(),
    queryFn: () => adminApi.getDepartments(),
    staleTime: REFERENCE_STALE_TIME_MS,
  });

export const fetchTagsCached = () =>
  queryClient.fetchQuery({
    queryKey: queryKeys.reference.tags(),
    queryFn: () => adminApi.getTags(),
    staleTime: REFERENCE_STALE_TIME_MS,
  });

export const fetchDocumentTypesCached = (departmentId: number) =>
  queryClient.fetchQuery(documentTypesQuery(departmentId));

export const fetchFoldersCached = (params: FolderListParams = {}) =>
  queryClient.fetchQuery({
    queryKey: queryKeys.folders.list(params),
    queryFn: () => listFolders(params),
  });
