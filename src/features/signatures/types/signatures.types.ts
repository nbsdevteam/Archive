/**
 * Signatures feature types
 * Based on API_DOCUMENTATION.md
 */

export interface SignatureRequest {
  id: number;
  document_id: number;
  signer_id?: number;
  signer_name?: string;
  document_title?: string;
  requester_name?: string;
  message?: string;
  state: "pending" | "approved" | "rejected" | "completed";
  sign_token?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SignatureListParams {
  state?: string;
  page?: number;
  per_page?: number;
}

export interface SignatureListResponse {
  signatures: SignatureRequest[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
