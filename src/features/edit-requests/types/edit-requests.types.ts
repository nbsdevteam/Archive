/**
 * Edit Requests feature types
 * Based on API_DOCUMENTATION.md
 */

export interface EditRequest {
  id: number;
  document_id: number;
  requester_id?: number;
  requester_name?: string;
  requester?: {
    id: number;
    name: string;
  };
  document_title?: string;
  document?: {
    id: number;
    name: string;
    title?: string;
  };
  reason?: string;
  status?: "pending" | "approved" | "rejected";
  state?: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  unlock_token?: string;
  request_date?: string;
  created_at?: string;
  updated_at?: string;
  can_approve?: boolean;
}

export interface EditRequestListParams {
  page?: number;
  per_page?: number;
}

export interface EditRequestListResponse {
  requests: EditRequest[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
