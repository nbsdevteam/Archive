/**
 * useSignatures - Hook for signature requests
 * Provides data fetching and state management for signature requests
 */

import { useState, useEffect, useCallback } from "react";
import * as signaturesApi from "../services/signatures.api";
import * as signaturesService from "../services/signatures.service";
import type { SignatureRequest, SignatureListParams } from "../types/signatures.types";

interface UseSignaturesOptions {
  useApi?: boolean;
  initialParams?: SignatureListParams;
}

export const useSignatures = (options: UseSignaturesOptions = {}) => {
  const { useApi = false, initialParams = {} } = options;

  const [signatures, setSignatures] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignatures = useCallback(
    async (params: SignatureListParams = {}) => {
      try {
        setLoading(true);
        setError(null);
        const response = await signaturesService.getSignatures(
          { ...initialParams, ...params },
          useApi
        );
        setSignatures(response.signatures || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load signature requests");
        setSignatures([]);
      } finally {
        setLoading(false);
      }
    },
    [useApi, initialParams]
  );

  const approveSignature = useCallback(
    async (requestId: number) => {
      try {
        const response = await signaturesService.approveSignatureRequest(requestId, useApi);
        if (response.success) {
          await fetchSignatures();
          return response;
        }
        throw new Error(response.error || "Failed to approve signature");
      } catch (err: any) {
        throw err;
      }
    },
    [useApi, fetchSignatures]
  );

  const rejectSignature = useCallback(
    async (requestId: number, rejectionReason?: string) => {
      try {
        const response = await signaturesService.rejectSignatureRequest(
          requestId,
          rejectionReason,
          useApi
        );
        if (response.success) {
          await fetchSignatures();
          return response;
        }
        throw new Error(response.error || "Failed to reject signature");
      } catch (err: any) {
        throw err;
      }
    },
    [useApi, fetchSignatures]
  );

  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  return {
    signatures,
    loading,
    error,
    fetchSignatures,
    approveSignature,
    rejectSignature,
  };
};
