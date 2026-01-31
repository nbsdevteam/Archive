/**
 * Archive Services Public API
 */

// Export API functions
export * from "./archive.api";

// Export service functions with explicit names to avoid conflicts
export {
  getDocuments,
  getFolders,
  uploadDocument as uploadDocumentService,
  downloadDocument as downloadDocumentService,
  archiveDocument as archiveDocumentService,
  unarchiveDocument as unarchiveDocumentService,
} from "./archive.service";
