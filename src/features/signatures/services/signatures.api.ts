/**
 * Signatures API module
 * Direct API calls based on API_DOCUMENTATION.md
 * All endpoints use JSON (NOT JSON-RPC)
 */

import { httpRequest } from "../../../shared/lib/http";
import type {
  SignatureRequest,
  SignatureListParams,
  SignatureListResponse,
} from "../types/signatures.types";

/**
 * List signature requests
 * POST /api/signatures (type=json)
 */
export const listSignatures = async (
  params: SignatureListParams = {}
): Promise<SignatureListResponse> => {
  const result = await httpRequest<SignatureListResponse | SignatureRequest[] | { data: SignatureRequest[] }>(
    "/api/signatures",
    {
      state: params.state,
      page: params.page || 1,
      per_page: params.per_page || 20,
    }
  );

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { signatures: result as SignatureRequest[] };
  }
  if (typeof result === "object" && "signatures" in result) {
    return result as SignatureListResponse;
  }
  if (typeof result === "object" && "data" in result) {
    const dataResult = result as { data: SignatureRequest[] };
    return { signatures: dataResult.data };
  }
  return { signatures: [] };
};

/**
 * Create signature request
 * POST /api/signatures/create (type=json)
 */
export const createSignatureRequest = async (
  documentId: number,
  signerId: number,
  message?: string
): Promise<{ success: boolean; signature?: SignatureRequest; error?: string }> => {
  try {
    const result = await httpRequest<SignatureRequest | { data: SignatureRequest }>(
      "/api/signatures/create",
      {
        document_id: documentId,
        signer_id: signerId,
        message: message || "",
      }
    );

    // Handle ApiResponse wrapper
    const signature = (result as any)?.data || result;

    return {
      success: true,
      signature: signature as SignatureRequest,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to create signature request",
    };
  }
};

/**
 * Approve signature request
 * POST /api/signatures/<request_id>/approve (type=json)
 * Returns sign_token
 */
export const approveSignatureRequest = async (
  requestId: number
): Promise<{ success: boolean; sign_token?: string; error?: string }> => {
  try {
    const result = await httpRequest<{ sign_token: string } | { data: { sign_token: string } }>(
      `/api/signatures/${requestId}/approve`,
      {}
    );

    const signToken = (result as any)?.sign_token || (result as any)?.data?.sign_token;

    return {
      success: true,
      sign_token: signToken,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to approve signature request",
    };
  }
};

/**
 * Reject signature request
 * POST /api/signatures/<request_id>/reject (type=json)
 */
export const rejectSignatureRequest = async (
  requestId: number,
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await httpRequest(
      `/api/signatures/${requestId}/reject`,
      {
        rejection_reason: rejectionReason || "",
      }
    );

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to reject signature request",
    };
  }
};

/**
 * Upload signed document
 * POST /api/signatures/<request_id>/upload-signed (type=json)
 */
export const uploadSignedDocument = async (
  requestId: number,
  fileName: string,
  fileData: string, // base64
  signToken: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await httpRequest(
      `/api/signatures/${requestId}/upload-signed`,
      {
        file_name: fileName,
        file_data: fileData,
        sign_token: signToken,
        notes: notes || "",
      }
    );

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to upload signed document",
    };
  }
};
