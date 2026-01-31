/**
 * Edit Requests utilities
 * Static mock data
 */

import type { EditRequest } from "../types/edit-requests.types";

export const staticEditRequests: EditRequest[] = [
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
];
