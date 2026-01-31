/**
 * Edit Requests Services Public API
 */

// Export API functions
export * from "./edit-requests.api";

// Export service functions with explicit names to avoid conflicts
export {
  getEditRequests,
  getPendingApprovals as getPendingApprovalsService,
  createEditRequest as createEditRequestService,
  approveEditRequest as approveEditRequestService,
  rejectEditRequest as rejectEditRequestService,
} from "./edit-requests.service";
