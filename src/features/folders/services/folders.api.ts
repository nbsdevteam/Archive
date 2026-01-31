/**
 * Folders API module
 * Direct API calls based on API_DOCUMENTATION.md
 * Uses JSON-RPC 2.0
 */

import { jsonRpcRequest } from "../../../shared/lib/http";
import type { Folder, FolderListParams, FolderListResponse } from "../types/folders.types";

/**
 * List folders
 * POST /api/folders (type=jsonrpc)
 */
export const listFolders = async (
  params: FolderListParams = {}
): Promise<FolderListResponse> => {
  const result = await jsonRpcRequest<FolderListResponse | Folder[] | { data: Folder[]; pagination?: any }>(
    "/api/folders",
    {
      department_id: params.department_id,
      folder_type: params.folder_type,
      state: params.state || "active",
    }
  );

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { folders: result as Folder[] };
  }
  if (typeof result === "object" && "folders" in result) {
    return result as FolderListResponse;
  }
  if (typeof result === "object" && "data" in result) {
    const dataResult = result as { data: Folder[]; pagination?: any };
    return {
      folders: dataResult.data,
      pagination: dataResult.pagination,
    };
  }
  return { folders: [] };
};

export interface CreateFolderParams {
  name: string;
  code: string;
  department_id: number;
  folder_type?: string;
  description?: string | null;
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
    ...(params.folder_type != null && { folder_type: params.folder_type }),
    ...(params.description != null && params.description !== "" && { description: params.description }),
  });
  if (!result?.success) {
    throw new Error(result?.error || "Failed to create folder");
  }
  return result.data;
};

export interface FolderWorkflowInfo {
  workflow_id?: number;
  workflow_name?: string;
  state?: string;
  allowed_transitions?: Array<{ id: number; name: string; target_state?: string }>;
}

export interface FolderWorkflowResponse {
  success: boolean;
  data?: FolderWorkflowInfo;
}

/**
 * Get folder workflow (allowed transitions for current user)
 * POST /api/folders/<folder_id>/workflow (type=jsonrpc)
 */
export const getFolderWorkflow = async (
  folderId: number
): Promise<FolderWorkflowResponse> => {
  const result = await jsonRpcRequest<FolderWorkflowResponse | FolderWorkflowInfo>(
    `/api/folders/${folderId}/workflow`,
    {}
  );
  if (typeof result === "object" && result !== null && "allowed_transitions" in result) {
    return { success: true, data: result as FolderWorkflowInfo };
  }
  return result as FolderWorkflowResponse;
};

/**
 * Apply workflow transition
 * POST /api/folders/<folder_id>/workflow/transition (type=jsonrpc)
 */
export const applyFolderTransition = async (
  folderId: number,
  params: { transition_id: number; message?: string }
): Promise<{ success: boolean }> => {
  const result = await jsonRpcRequest<{ success: boolean }>(
    `/api/folders/${folderId}/workflow/transition`,
    params
  );
  return result as { success: boolean };
};
