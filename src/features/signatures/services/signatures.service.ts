/**
 * Signatures Service Layer
 * Orchestrates API calls and provides static data fallback
 */

import * as signaturesApi from "./signatures.api";
import type {
  SignatureRequest,
  SignatureListParams,
  SignatureListResponse,
} from "../types/signatures.types";

/**
 * Get signature requests (with static fallback)
 */
export const getSignatures = async (
  params: SignatureListParams = {},
  useApi: boolean = false
): Promise<SignatureListResponse> => {
  if (useApi) {
    return signaturesApi.listSignatures(params);
  }

  // Static mock data
  return {
    signatures: [
      {
        id: 1,
        document_id: 123,
        signer_id: 1,
        message: "Please sign this contract",
        state: "pending",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        document_id: 456,
        signer_id: 2,
        message: "Signature required",
        state: "approved",
        sign_token: "sign_token_123",
        created_at: new Date().toISOString(),
      },
    ],
  };
};

/**
 * Create signature request
 */
export const createSignatureRequest = async (
  documentId: number,
  signerId: number,
  message?: string,
  useApi: boolean = false
): Promise<{ success: boolean; signature?: SignatureRequest; error?: string }> => {
  if (useApi) {
    return signaturesApi.createSignatureRequest(documentId, signerId, message);
  }

  // Static mock response
  return {
    success: true,
    signature: {
      id: Date.now(),
      document_id: documentId,
      signer_id: signerId,
      message: message || "",
      state: "pending",
      created_at: new Date().toISOString(),
    },
  };
};

/**
 * Approve signature request
 */
export const approveSignatureRequest = async (
  requestId: number,
  useApi: boolean = false
): Promise<{ success: boolean; sign_token?: string; error?: string }> => {
  if (useApi) {
    return signaturesApi.approveSignatureRequest(requestId);
  }

  // Static mock response
  return {
    success: true,
    sign_token: `sign_token_${requestId}_${Date.now()}`,
  };
};

/**
 * Reject signature request
 */
export const rejectSignatureRequest = async (
  requestId: number,
  rejectionReason?: string,
  useApi: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  if (useApi) {
    return signaturesApi.rejectSignatureRequest(requestId, rejectionReason);
  }

  // Static mock response
  return { success: true };
};

/**
 * Upload signed document
 */
export const uploadSignedDocument = async (
  requestId: number,
  fileName: string,
  fileData: string,
  signToken: string,
  notes?: string,
  useApi: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  if (useApi) {
    return signaturesApi.uploadSignedDocument(requestId, fileName, fileData, signToken, notes);
  }

  // Static mock response
  return { success: true };
};
