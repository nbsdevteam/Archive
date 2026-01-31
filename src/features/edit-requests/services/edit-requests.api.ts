/**
 * Edit Requests API module
 * Direct API calls based on API_DOCUMENTATION.md
 * All endpoints use JSON-RPC 2.0
 */

import { jsonRpcRequest } from "../../../shared/lib/http";
import type {
  EditRequest,
  EditRequestListParams,
  EditRequestListResponse,
} from "../types/edit-requests.types";

/**
 * List edit requests
 * POST /api/edit-requests (type=jsonrpc)
 */
export const listEditRequests = async (
  params: EditRequestListParams = {}
): Promise<EditRequestListResponse> => {
  const result = await jsonRpcRequest<EditRequestListResponse | EditRequest[] | { data: EditRequest[]; pagination?: any }>(
    "/api/edit-requests",
    {
      page: params.page || 1,
      per_page: params.per_page || 20,
    }
  );

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { requests: result as EditRequest[] };
  }
  if (typeof result === "object" && "requests" in result) {
    return result as EditRequestListResponse;
  }
  if (typeof result === "object" && "data" in result) {
    const dataResult = result as { data: EditRequest[]; pagination?: any };
    return {
      requests: dataResult.data,
      pagination: dataResult.pagination,
    };
  }
  return { requests: [] };
};

/**
 * Get pending approvals (for managers/admins)
 * POST /api/edit-requests/pending-approvals (type=jsonrpc)
 */
export const getPendingApprovals = async (): Promise<EditRequestListResponse> => {
  const result = await jsonRpcRequest<EditRequestListResponse>(
    "/api/edit-requests/pending-approvals",
    {}
  );

  if (Array.isArray(result)) {
    return { requests: result as EditRequest[] };
  }
  if (typeof result === "object" && "requests" in result) {
    return result as EditRequestListResponse;
  }
  return { requests: [] };
};

/**
 * Create edit request
 * POST /api/edit-requests/create (type=jsonrpc)
 */
export const createEditRequest = async (
  documentId: number,
  reason?: string
): Promise<{ success: boolean; request?: EditRequest; error?: string }> => {
  try {
    const result = await jsonRpcRequest<EditRequest>(
      "/api/edit-requests/create",
      {
        document_id: documentId,
        reason: reason || "",
      }
    );

    return {
      success: true,
      request: result as EditRequest,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to create edit request",
    };
  }
};

/**
 * Approve edit request (manager/admin)
 * POST /api/edit-requests/<request_id>/approve (type=jsonrpc)
 * Returns unlock_token
 */
export const approveEditRequest = async (
  requestId: number
): Promise<{ success: boolean; unlock_token?: string; error?: string }> => {
  try {
    const result = await jsonRpcRequest<{ unlock_token: string }>(
      `/api/edit-requests/${requestId}/approve`,
      {}
    );

    return {
      success: true,
      unlock_token: (result as any)?.unlock_token,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to approve edit request",
    };
  }
};

/**
 * Reject edit request (manager/admin)
 * POST /api/edit-requests/<request_id>/reject (type=jsonrpc)
 */
export const rejectEditRequest = async (
  requestId: number,
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await jsonRpcRequest(
      `/api/edit-requests/${requestId}/reject`,
      {
        rejection_reason: rejectionReason || "",
      }
    );

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to reject edit request",
    };
  }
};
