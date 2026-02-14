import { useEffect, useRef, useState } from "react";
import { all_routes } from "../../../router/all_routes";
import { useSignatureStore } from "../stores/signatureStore";

export const useSignatureRequestsPageContainer = () => {
  const routes = all_routes;
  const { requests, fetchRequests, approve, reject, isLoading, error } = useSignatureStore();
  const [tab, setTab] = useState<"all" | "pending">("pending");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const didRunRef = useRef(false);
  const lastTabRef = useRef<"all" | "pending" | null>(null);

  useEffect(() => {
    if (didRunRef.current && lastTabRef.current === tab) return;
    didRunRef.current = true;
    lastTabRef.current = tab;
    fetchRequests(tab === "pending" ? { state: "pending" } : {});
    return () => {
      setTimeout(() => {
        didRunRef.current = false;
      }, 0);
    };
  }, [tab, fetchRequests]);

  const handleApprove = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await approve(requestId);
      fetchRequests(tab === "pending" ? { state: "pending" } : {});
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Failed to approve signature:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await reject(requestId, "Rejected by user");
      fetchRequests(tab === "pending" ? { state: "pending" } : {});
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Failed to reject signature:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRetry = () => {
    fetchRequests(tab === "pending" ? { state: "pending" } : {});
  };

  return {
    routes,
    requests,
    fetchRequests,
    isLoading,
    error,
    tab,
    setTab,
    processingId,
    handleApprove,
    handleReject,
    handleRetry,
  };
};
