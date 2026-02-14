import { useEffect, useRef, useState } from "react";
import { all_routes } from "../../../router/all_routes";
import { editRequestsApi, type EditRequest } from "../../../app/adapter/api/editRequests.api";
import { handleApiError } from "../../../app/adapter/api/client";

export const useEditRequestsPageContainer = () => {
  const routes = all_routes;
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const didRunRef = useRef(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await editRequestsApi.getEditRequests();
      const list = Array.isArray(response?.data) ? response.data : [];
      setRequests(list);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Failed to load requests:", err);
      setError(handleApiError(err));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;
    loadRequests();
    return () => {
      setTimeout(() => {
        didRunRef.current = false;
      }, 0);
    };
  }, []);

  const handleApprove = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await editRequestsApi.approveEditRequest(requestId);
      await loadRequests();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Failed to approve request:", err);
      setError(handleApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await editRequestsApi.rejectEditRequest(requestId, "Rejected by user");
      await loadRequests();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Failed to reject request:", err);
      setError(handleApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  return {
    routes,
    requests,
    loading,
    error,
    processingId,
    loadRequests,
    handleApprove,
    handleReject,
  };
};
