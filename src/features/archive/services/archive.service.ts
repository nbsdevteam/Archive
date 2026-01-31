/**
 * Archive service layer
 * Orchestrates API calls and provides feature-level business logic
 * Can fall back to static data when useApi is false
 */

import * as archiveApi from "./archive.api";
import type {
  Document,
  Folder,
  DocumentListParams,
  FolderListParams,
  UploadDocumentParams,
  DocumentListResponse,
  FolderListResponse,
} from "../types/archive.types";

/**
 * Static mock data (current implementation)
 */
const staticDocuments: Document[] = [
  { name: "Invoice_2024_Q1.xlsx", type: "Spreadsheet", updated: "Today" },
  { name: "Service_Agreement.pdf", type: "PDF", updated: "Yesterday" },
  { name: "Policy_Update.docx", type: "Document", updated: "2 days ago" },
  { name: "Project_Alpha_Brief.pptx", type: "Presentation", updated: "Last week" },
  { name: "Compliance_Checklist.pdf", type: "PDF", updated: "Last week" },
];

const staticFolders: Folder[] = [
  { name: "Legal / Compliance", docs: 84, updated: "Today" },
  { name: "Finance / Invoices", docs: 142, updated: "Yesterday" },
  { name: "HR / Policies", docs: 36, updated: "2 days ago" },
  { name: "Projects / Alpha", docs: 58, updated: "3 days ago" },
  { name: "Contracts / Vendors", docs: 73, updated: "Last week" },
  { name: "Operations / SOPs", docs: 29, updated: "Last week" },
];

/**
 * Get documents list
 * @param params - Filter parameters
 * @param useApi - Whether to use API (default: false for static fallback)
 */
export const getDocuments = async (
  params: DocumentListParams = {},
  useApi: boolean = false
): Promise<DocumentListResponse> => {
  if (useApi) {
    try {
      return await archiveApi.listDocuments(params);
    } catch (error) {
      console.error("Failed to fetch documents from API:", error);
      // Fall back to static data on error
      return { documents: staticDocuments };
    }
  }
  return { documents: staticDocuments };
};

/**
 * Get folders list
 * @param params - Filter parameters
 * @param useApi - Whether to use API (default: false for static fallback)
 */
export const getFolders = async (
  params: FolderListParams = {},
  useApi: boolean = false
): Promise<FolderListResponse> => {
  if (useApi) {
    try {
      return await archiveApi.listFolders(params);
    } catch (error) {
      console.error("Failed to fetch folders from API:", error);
      // Fall back to static data on error
      return { folders: staticFolders };
    }
  }
  return { folders: staticFolders };
};

/**
 * Upload a document
 * @param params - Upload parameters
 * @param useApi - Whether to use API (default: false)
 */
export const uploadDocument = async (
  params: UploadDocumentParams,
  useApi: boolean = false
): Promise<{ success: boolean; data?: Document; error?: string }> => {
  if (useApi) {
    try {
      return await archiveApi.uploadDocument(params);
    } catch (error) {
      console.error("Failed to upload document:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }
  // Static mode: simulate success
  return {
    success: true,
    data: {
      name: params.file_name,
      type: params.file_name.split(".").pop() || "File",
      updated: "Just now",
    },
  };
};

/**
 * Download a document
 * @param documentId - Document ID
 * @param versionId - Optional version ID
 * @param useApi - Whether to use API (default: false)
 */
export const downloadDocument = async (
  documentId: number,
  versionId?: number,
  useApi: boolean = false
): Promise<Blob | null> => {
  if (useApi) {
    try {
      return await archiveApi.downloadDocument(documentId, versionId);
    } catch (error) {
      console.error("Failed to download document:", error);
      return null;
    }
  }
  // Static mode: return null (no actual download)
  return null;
};

/**
 * Archive a document
 * @param documentId - Document ID
 * @param useApi - Whether to use API (default: false)
 */
export const archiveDocument = async (
  documentId: number,
  useApi: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  if (useApi) {
    try {
      return await archiveApi.archiveDocument(documentId);
    } catch (error) {
      console.error("Failed to archive document:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Archive failed",
      };
    }
  }
  // Static mode: simulate success
  return { success: true };
};

/**
 * Unarchive a document
 * @param documentId - Document ID
 * @param useApi - Whether to use API (default: false)
 */
export const unarchiveDocument = async (
  documentId: number,
  useApi: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  if (useApi) {
    try {
      return await archiveApi.unarchiveDocument(documentId);
    } catch (error) {
      console.error("Failed to unarchive document:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unarchive failed",
      };
    }
  }
  // Static mode: simulate success
  return { success: true };
};
