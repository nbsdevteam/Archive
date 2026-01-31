/**
 * Edit Requests Service Layer
 * Orchestrates API calls and provides static data fallback
 */

import * as editRequestsApi from "./edit-requests.api";
import type {
  EditRequest,
  EditRequestListParams,
  EditRequestListResponse,
} from "../types/edit-requests.types";

/**
 * Get edit requests (with static fallback)
 */
export const getEditRequests = async (
  params: EditRequestListParams = {},
  useApi: boolean = false
): Promise<EditRequestListResponse> => {
  if (useApi) {
    return editRequestsApi.listEditRequests(params);
  }

  // Static mock data
  return {
    requests: [
      {
        id: 1,
        document_id: 123,
        requester_id: 1,
        reason: "Need to update amounts",
        status: "pending",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        document_id: 456,
        requester_id: 2,
        reason: "Add new clause",
        status: "approved",
        unlock_token: "token123",
        created_at: new Date().toISOString(),
      },
    ],
  };
};

/**
 * Get pending approvals
 */
export const getPendingApprovals = async (
  useApi: boolean = false
): Promise<EditRequestListResponse> => {
  if (useApi) {
    return editRequestsApi.getPendingApprovals();
  }

  // Static mock data
  return {
    requests: [
      {
        id: 1,
        document_id: 123,
        requester_id: 1,
        reason: "Need to update amounts",
        status: "pending",
        created_at: new Date().toISOString(),
      },
    ],
  };
};

/**
 * Create edit request
 */
export const createEditRequest = async (
  documentId: number,
  reason?: string,
  useApi: boolean = false
): Promise<{ success: boolean; request?: EditRequest; error?: string }> => {
  if (useApi) {
    return editRequestsApi.createEditRequest(documentId, reason);
  }

  // Static mock response
  return {
    success: true,
    request: {
      id: Date.now(),
      document_id: documentId,
      requester_id: 1,
      reason: reason || "",
      status: "pending",
      created_at: new Date().toISOString(),
    },
  };
};

/**
 * Approve edit request
 */
export const approveEditRequest = async (
  requestId: number,
  useApi: boolean = false
): Promise<{ success: boolean; unlock_token?: string; error?: string }> => {
  if (useApi) {
    return editRequestsApi.approveEditRequest(requestId);
  }

  // Static mock response
  return {
    success: true,
    unlock_token: `token_${requestId}_${Date.now()}`,
  };
};

/**
 * Reject edit request
 */
export const rejectEditRequest = async (
  requestId: number,
  rejectionReason?: string,
  useApi: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  if (useApi) {
    return editRequestsApi.rejectEditRequest(requestId, rejectionReason);
  }

  // Static mock response
  return { success: true };
};
