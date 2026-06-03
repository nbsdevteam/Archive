/**
 * Documents API - Domain Module Exports
 * Provides organized domain modules + backward-compatible documentsApi object.
 */

// ========== Type Exports ==========
export type {
  UploadKind,
  ConfidentialityLevel,
  Document,
  DocumentVersion,
  DocumentDetail,
  Attachment,
  DocumentsResponse,
  DocumentDetailResponse,
  TrashDocumentsResponse,
  GetDocumentsParams,
  UploadDocumentRequest,
  UploadDocumentResponse,
  UpdateDocumentParams,
  UpdateDocumentResponse,
  StartBulkUploadParams,
  BulkUploadStartData,
  BulkUploadUploadFileParams,
  BulkUploadUploadFileResponse,
  BulkUploadFinalizeData,
  BulkUploadProgressData,
  ListBulkUploadJobsParams,
  DeleteLikeResponse,
  SingleCallBulkUploadParams,
  SingleCallBulkUploadResponse,
  UploadSingleFileParams,
  UploadSingleFileResponse,
  UploadSingleFileBaseParams,
  UploadFileResult,
  SetDocumentRemindersParams,
  SetDocumentRemindersResponse,
} from './types';

// ========== Utility Exports ==========
export { getRpcResult, assertSuccess, inferPreviewContentType } from './utils';

// ========== Domain Function Exports ==========
// Core CRUD
export * from './core';

// Preview & Download
export * from './preview';

// Attachments
export * from './attachments';

// Versions
export * from './versions';

// Lifecycle
export * from './lifecycle';

// Relations
export * from './relations';

// Bulk Upload
export * from './bulk-upload';

// Batch Operations
export * from './batch';

// Report
export * from './report';

// Reminders
export * from './reminders';

// ========== Backward Compatibility: documentsApi Object ==========
import * as core from './core';
import * as preview from './preview';
import * as attachments from './attachments';
import * as versions from './versions';
import * as lifecycle from './lifecycle';
import * as relations from './relations';
import * as bulkUpload from './bulk-upload';
import * as batch from './batch';
import * as reminders from './reminders';

/**
 * Backward-compatible documentsApi object.
 * Preserves the existing API shape for gradual migration.
 * @deprecated Prefer importing domain functions directly (e.g., import { getDocuments } from '@/app/adapter/api/documents').
 */
export const documentsApi = {
  // Core CRUD
  getDocuments: core.getDocuments,
  getDocument: core.getDocument,
  updateDocument: core.updateDocument,
  uploadDocument: core.uploadDocument,

  // Preview & Download
  downloadDocument: preview.downloadDocument,
  getDocumentForPreview: preview.getDocumentForPreview,
  downloadAttachment: preview.downloadAttachment,
  getAttachmentForPreview: preview.getAttachmentForPreview,

  // Attachments
  addAttachment: attachments.addAttachment,
  listAttachments: attachments.listAttachments,
  deleteAttachment: attachments.deleteAttachment,
  updateAttachment: attachments.updateAttachment,
  uploadMultipleAttachments: attachments.uploadMultipleAttachments,

  // Versions
  uploadVersion: (
    documentId: number,
    fileData: string,
    fileName: string,
    unlockToken: string,
    changeDescription: string
  ) => {
    return versions.uploadVersion(documentId, {
      file_data: fileData,
      file_name: fileName,
      unlock_token: unlockToken,
      change_description: changeDescription,
    });
  },
  getVersions: versions.getVersions,

  // Lifecycle
  archiveDocument: lifecycle.archiveDocument,
  unarchiveDocument: lifecycle.unarchiveDocument,
  trashDocument: lifecycle.trashDocument,
  permanentDeleteDocument: lifecycle.permanentDeleteDocument,
  permanentDeleteDocuments: (ids: number[]) => lifecycle.permanentDeleteDocument(ids),
  restoreDocument: lifecycle.restoreDocument,
  getTrashDocuments: lifecycle.getTrashDocuments,
  listTrashDocuments: lifecycle.getTrashDocuments,

  // Relations
  getRelations: relations.getRelations,
  addRelation: relations.addRelation,
  setParent: relations.setParent,

  // Bulk Upload
  startBulkUpload: bulkUpload.startBulkUpload,
  uploadFileToBulkJob: bulkUpload.uploadFileToBulkJob,
  finalizeBulkUpload: bulkUpload.finalizeBulkUpload,
  getBulkUploadProgress: bulkUpload.getBulkUploadProgress,
  cancelBulkUploadJob: bulkUpload.cancelBulkUploadJob,
  listBulkUploadJobs: bulkUpload.listBulkUploadJobs,
  singleCallBulkUpload: bulkUpload.singleCallBulkUpload,
  uploadSingleFile: bulkUpload.uploadSingleFile,
  uploadFilesWithConcurrency: bulkUpload.uploadFilesWithConcurrency,

  // Batch Operations
  batchMoveDocumentsToFolder: batch.batchMoveDocumentsToFolder,

  // Reminders
  setDocumentReminders: reminders.setDocumentReminders,
};
