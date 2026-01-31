/**
 * useEditRequests - Hook for edit requests
 * Provides data fetching and state management for edit requests
 */

import { useState, useEffect, useCallback } from "react";
import * as editRequestsApi from "../services/edit-requests.api";
import { staticEditRequests } from "../utils/editRequestsUtils";
import type { EditRequest, EditRequestListParams } from "../types/edit-requests.types";

interface UseEditRequestsOptions {
  useApi?: boolean;
  initialParams?: EditRequestListParams;
}

export const useEditRequests = (options: UseEditRequestsOptions = {}) => {
  const { useApi = false, initialParams = {} } = options;

  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(
    async (params: EditRequestListParams = {}) => {
      try {
        setLoading(true);
        setError(null);
        let response;
        if (useApi) {
          try {
            response = await editRequestsApi.listEditRequests({ ...initialParams, ...params });
          } catch (err) {
            console.error("Failed to fetch edit requests from API:", err);
            response = { requests: staticEditRequests };
          }
        } else {
          response = { requests: staticEditRequests };
        }
        setRequests(response.requests || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load edit requests");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    },
    [useApi, initialParams]
  );

  const approveRequest = useCallback(
    async (requestId: number) => {
      try {
        let response;
        if (useApi) {
          response = await editRequestsApi.approveEditRequest(requestId);
        } else {
          // Static mock response
          response = {
            success: true,
            unlock_token: `token_${requestId}_${Date.now()}`,
          };
        }
        if (response.success) {
          await fetchRequests();
          return response;
        }
        throw new Error(response.error || "Failed to approve request");
      } catch (err: any) {
        throw err;
      }
    },
    [useApi, fetchRequests]
  );

  const rejectRequest = useCallback(
    async (requestId: number, rejectionReason?: string) => {
      try {
        let response;
        if (useApi) {
          response = await editRequestsApi.rejectEditRequest(requestId, rejectionReason);
        } else {
          // Static mock response
          response = { success: true };
        }
        if (response.success) {
          await fetchRequests();
          return response;
        }
        throw new Error(response.error || "Failed to reject request");
      } catch (err: any) {
        throw err;
      }
    },
    [useApi, fetchRequests]
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    fetchRequests,
    approveRequest,
    rejectRequest,
  };
};
