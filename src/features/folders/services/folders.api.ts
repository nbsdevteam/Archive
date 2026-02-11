/**
 * Folders API module
 * Aligned with NBS_ARCHIVE_API_REFERENCE_FRONTEND.md (sections 6.1–6.8)
 * Uses JSON-RPC 2.0
 */

import { jsonRpcRequest, httpDelete } from "../../../shared/lib/http";
import type {
  Folder,
  FolderDetail,
  FolderDocumentsResponse,
  FolderListParams,
  FolderListResponse,
} from "../types/folders.types";

/**
 * List folders
 * POST /api/folders (type=jsonrpc)
 */
export const listFolders = async (
  params: FolderListParams = {}
): Promise<FolderListResponse> => {
  const result = await jsonRpcRequest<
    FolderListResponse | Folder[] | { success?: boolean; data: Folder[]; count?: number; pagination?: unknown }
  >("/api/folders", {
    department_id: params.department_id,
    parent_id: params.parent_id,
    folder_type: params.folder_type,
    state: params.state || "active",
  });

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { folders: result as Folder[] };
  }
  if (typeof result === "object" && "folders" in result) {
    return result as FolderListResponse;
  }
  if (typeof result === "object" && "data" in result) {
    const dataResult = result as { data: Folder[]; count?: number; pagination?: unknown };
    return {
      folders: dataResult.data,
      pagination: dataResult.pagination as FolderListResponse["pagination"],
    };
  }
  return { folders: [] };
};

/**
 * Get folder by id (NBS 6.2)
 * POST /api/folders/<folder_id> (type=jsonrpc)
 */
export const getFolder = async (folderId: number): Promise<FolderDetail> => {
  const result = await jsonRpcRequest<{ success?: boolean; data?: FolderDetail } | FolderDetail>(
    `/api/folders/${folderId}`,
    {}
  );
  if (typeof result === "object" && result !== null && "data" in result && result.data) {
    return result.data as FolderDetail;
  }
  return result as FolderDetail;
};

/**
 * Get folder documents (NBS 6.8).
 * If response has no folder, fetches folder separately so caller always has folder details.
 */
export const getFolderDocuments = async (
  folderId: number
): Promise<FolderDocumentsResponse> => {
  const result = await jsonRpcRequest<FolderDocumentsResponse>(
    `/api/folders/${folderId}/documents`,
    {}
  );
  if (result?.folder) {
    return result;
  }
  const folder = await getFolder(folderId);
  return { ...result, data: result?.data ?? [], folder };
};

export interface CreateFolderParams {
  name: string;
  code: string;
  department_id: number;
  parent_id?: number | null;
  folder_type?: string;
  description?: string | null;
  restricted?: boolean;
  color?: string;
  icon?: string;
  sequence?: number;
}

export interface CreateFolderResponse {
  success: boolean;
  data: Folder;
  error?: string;
  message?: string;
}

/**
 * Create folder
 * POST /api/folders/create (type=jsonrpc)
 */
export const createFolder = async (
  params: CreateFolderParams
): Promise<Folder> => {
  const result = await jsonRpcRequest<CreateFolderResponse>("/api/folders/create", {
    name: params.name,
    code: params.code,
    department_id: params.department_id,
    ...(params.parent_id != null && { parent_id: params.parent_id }),
    ...(params.folder_type != null && { folder_type: params.folder_type }),
    ...(params.description != null && params.description !== "" && { description: params.description }),
    ...(params.restricted != null && { restricted: params.restricted }),
    ...(params.color != null && { color: params.color }),
    ...(params.icon != null && { icon: params.icon }),
    ...(params.sequence != null && { sequence: params.sequence }),
  });
  if (!result?.success) {
    throw new Error(result?.error || "Failed to create folder");
  }
  return result.data;
};

/** Params for update folder (NBS 6.4); all optional for partial update */
export interface UpdateFolderParams {
  name?: string;
  code?: string;
  description?: string | null;
  parent_id?: number | null;
  restricted?: boolean;
  color?: string;
  icon?: string;
  sequence?: number;
}

export interface UpdateFolderResponse {
  success: boolean;
  data?: Folder;
  error?: string;
  message?: string;
}

/**
 * Update folder (NBS 6.4)
 * POST /api/folders/<folder_id>/update (type=jsonrpc)
 * Backend may return { success: true, message } or { success: true, data: Folder }.
 */
export const updateFolder = async (
  folderId: number,
  params: UpdateFolderParams
): Promise<void> => {
  const body: Record<string, unknown> = {};
  if (params.name !== undefined) body.name = params.name;
  if (params.code !== undefined) body.code = params.code;
  if (params.description !== undefined) body.description = params.description;
  if (params.parent_id !== undefined) body.parent_id = params.parent_id;
  if (params.restricted !== undefined) body.restricted = params.restricted;
  if (params.color !== undefined) body.color = params.color;
  if (params.icon !== undefined) body.icon = params.icon;
  if (params.sequence !== undefined) body.sequence = params.sequence;

  const result = await jsonRpcRequest<UpdateFolderResponse | Folder>(
    `/api/folders/${folderId}/update`,
    body
  );

  if (result && typeof result === "object" && "success" in result) {
    const res = result as UpdateFolderResponse;
    if (!res.success) {
      throw new Error(res.error || res.message || "Failed to update folder");
    }
    return;
  }

  if (result && typeof result === "object" && "id" in result && "name" in result) {
    return;
  }

  throw new Error("Unexpected response from update folder");
};

/** Backend JSON shape for DELETE /api/folders/<id> */
export interface DeleteFolderApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

/**
 * Delete folder (NBS 6.5)
 * DELETE /api/folders/<folder_id>
 * Returns { ok: true } only when the API clearly indicates success.
 * Throws on HTTP error or when the response body indicates failure (success === false or error present without success === true).
 */
export const deleteFolder = async (folderId: number): Promise<{ ok: true }> => {
  const data = await httpDelete<DeleteFolderApiResponse | undefined>(`/api/folders/${folderId}`);

  if (data && typeof data === "object") {
    const success = data.success === true;
    const hasError = Boolean(data.error ?? data.message);

    if (data.success === false || (hasError && !success)) {
      throw new Error(data.error ?? data.message ?? "Failed to delete folder");
    }
  }

  return { ok: true };
};
