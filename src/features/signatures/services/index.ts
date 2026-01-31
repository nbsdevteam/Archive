/**
 * Signatures Services Public API
 */

// Export API functions
export * from "./signatures.api";

// Export service functions with explicit names to avoid conflicts
export {
  getSignatures,
  createSignatureRequest as createSignatureRequestService,
  approveSignatureRequest as approveSignatureRequestService,
  rejectSignatureRequest as rejectSignatureRequestService,
  uploadSignedDocument as uploadSignedDocumentService,
} from "./signatures.service";
