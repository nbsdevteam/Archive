import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { all_routes } from "../../../router/all_routes";
import { editRequestsApi, type EditRequest } from "../../../app/adapter/api/editRequests.api";
import { handleApiError } from "../../../app/adapter/api/client";
import { queryClient } from "../../../shared/lib/queryClient";
import { queryKeys } from "../../../shared/lib/queryKeys";

const EMPTY_REQUESTS: EditRequest[] = [];

export const useEditRequestsPageContainer = () => {
  const routes = all_routes;
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: queryKeys.editRequests.list({}),
    queryFn: () => editRequestsApi.getEditRequests(),
  });
  const requests = Array.isArray(query.data?.data) ? query.data.data : EMPTY_REQUESTS;
  const loading = query.isLoading;
  const error = actionError ?? (query.isError ? handleApiError(query.error) : null);

  const loadRequests = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.editRequests.all });

  const handleApprove = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      setActionError(null);
      await editRequestsApi.approveEditRequest(requestId);
      await loadRequests();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Failed to approve request:", err);
      setActionError(handleApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      setActionError(null);
      await editRequestsApi.rejectEditRequest(requestId, "Rejected by user");
      await loadRequests();
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Failed to reject request:", err);
      setActionError(handleApiError(err));
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
