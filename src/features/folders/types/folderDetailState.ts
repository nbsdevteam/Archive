import type { TFunction } from "i18next";
import type { Document, DocumentDetail, Attachment } from "@/app/adapter/api/documents.api";
import type { DocumentBatchActionsResult } from "@/shared/services/documentBatchActionsService";
import type { Folder } from "@/features/folders/types/folders.types";
import type { ActivityViewMode } from "@/features/activity/types/auditLogs.types";
import type { NoteListItem, CreateNotePayload } from "@/features/notes/types/notes.types";
import type { UploadFormValues } from "@/features/documents/components/UploadDocument/types";

/** Manager object from admin API */
export interface Manager {
  id: number;
  name: string;
  login?: string;
}

/**
 * Folder detail page data slice.
 * Contains all derived/fetched data for the folder.
 */
export interface FolderDetailData {
  folderId: number | null;
  folder: Folder | null;
  documents: Document[];
  docsSorted: Document[];
  mainDoc: Document | null;
  subDocs: Document[];
  attachmentsDocId: number | "";
  attachments: Attachment[];
  managers: Manager[];
  notes: NoteListItem[];
  /** Current document from store (with versions); used for preview. */
  previewDoc: DocumentDetail | null;
  previewFileName: string;
}

/**
 * Folder detail page loading states.
 * Tracks async operation progress.
 */
export interface FolderDetailLoading {
  loading: boolean;
  loadingAttachments: boolean;
  activityLoading: boolean;
  loadingNotes: boolean;
  isSubDocArchiving: boolean;
  isSubDocUnarchiving: boolean;
  isSubDocTrashing: boolean;
  isAttachmentTrashing: boolean;
  isUpdatingAttachment: boolean;
  transferSubmitting: boolean;
  isCreatingNote: boolean;
  isUpdatingNote: boolean;
  isDeletingNote: boolean;
}

/**
 * Folder detail page error states.
 * Stores error messages from various operations.
 */
export interface FolderDetailErrors {
  main: string | null;
  activityError: string | null;
  notesError: string | null | undefined;
}

/**
 * Folder detail activity state.
 * Manages activity logs and view mode.
 */
export interface FolderDetailActivity {
  activityLogs: unknown[];
  activityLoading: boolean;
  activityError: string | null;
  activityDocumentCount: number;
  activityViewMode: ActivityViewMode;
  setActivityViewMode: React.Dispatch<React.SetStateAction<ActivityViewMode>>;
  refreshActivityLogs: () => void;
}

/**
 * Folder detail selection state.
 * Manages sub-doc and attachment selection for batch operations.
 */
export interface FolderDetailSelection {
  subDocSelectedIds: (string | number)[];
  /** Batch action visibility for sub-docs (common-only; from shared service). */
  subDocsBatchActions: DocumentBatchActionsResult;
  subDocsSelectionConfig: {
    isAllSelected: boolean;
    isIndeterminate: boolean;
    selectedIds: (string | number)[];
    onToggle: (id: string | number) => void;
    onToggleAll: () => void;
  } | null;
  attachmentSelectedIds: (string | number)[];
  attachmentsSelectionConfig: {
    isAllSelected: boolean;
    isIndeterminate: boolean;
    selectedIds: (string | number)[];
    onToggle: (id: string | number) => void;
    onToggleAll: () => void;
  } | null;
}

/**
 * Folder detail actions.
 * All handler functions for user interactions.
 */
export interface FolderDetailActions {
  formatDate: (date?: string | null) => string;
  handleNavigateToDocument: (docId: number) => void;
  handleUploadInFolder: () => void;
  handleAttachmentsDocIdChange: (docId: number) => void;
  handleAddAttachment: () => void;
  handleDownloadMainDocument: () => Promise<void>;
  handleDownloadDocument: (docId: number) => Promise<void>;
  handleDownloadAttachment: (attachmentId: number, fileName: string) => Promise<void>;
  handleArchiveFolderDocument: (docId: number) => Promise<void>;
  handleUnarchiveFolderDocument: (docId: number) => Promise<void>;
  setSignatureOpen: (v: boolean) => void;
  setSignatureSignerId: (v: number | "") => void;
  setSignatureMessage: (v: string) => void;
  openSignature: (docId: number) => void;
  submitSignature: () => Promise<void>;
  setEditOpen: (v: boolean) => void;
  setEditReason: (v: string) => void;
  openEditRequest: (docId: number) => void;
  submitEditRequest: () => Promise<void>;
  loadFolderDocuments: () => Promise<void>;
  handleCloseUploadPanel: () => void;
  refreshAttachmentsForCurrentDocument: () => void;
  setIsUploadOpen: (v: boolean) => void;
  clearSubDocsSelection: () => void;
  confirmSubDocTrash: (docId: number) => Promise<void>;
  confirmBatchSubDocTrash: () => Promise<void>;
  openTransferDocs: (docIds: number[]) => void;
  clearAttachmentsSelection: () => void;
  confirmAttachmentTrash: (attachmentId: number) => Promise<void>;
  confirmBatchAttachmentTrash: () => Promise<void>;
  openTransferAttachments: (attachmentIds: number[]) => void;
  handleViewAttachment: (attachmentId: number) => void;
  handleOpenEditAttachment: (id: number) => void;
  handleCloseEditAttachment: () => void;
  handleCloseAttachmentPanel: () => void;
  openAddAttachmentPanel: () => void;
  setEditAttachmentName: (v: string) => void;
  setEditAttachmentDescription: (v: string) => void;
  handleConfirmEditAttachment: (replaceFile?: File | null) => Promise<void>;
  closeTransferModal: () => void;
  handleTransferConfirm: (targetFolderId: number) => Promise<void>;
  handleOpenEditFolder: () => void;
  handleCloseEditFolder: () => void;
  handleEditFolderSuccess: () => void;
  handleOpenEditDocument: (docId: number) => void;
  handleCloseEditDocument: () => void;
  handleEditDocumentSuccess: () => void;
  confirmDeleteFolder: () => Promise<void>;
  handleLoadNotes: () => void;
  handleCreateNote: () => void;
  handleEditNote: (note: NoteListItem) => void;
  handleCloseNoteEditor: () => void;
  handleSaveNote: (payload: Omit<CreateNotePayload, "document_id" | "folder_id">) => Promise<void>;
  confirmDeleteNote: (noteId: number) => Promise<void>;
  handleViewNoteImage: (note: NoteListItem) => void;
  handleCloseNoteImageViewer: () => void;
}

/**
 * Folder detail modal states.
 * Manages visibility and form state for all modals.
 */
export interface FolderDetailModals {
  signatureOpen: boolean;
  signatureSignerId: number | "";
  signatureMessage: string;
  editOpen: boolean;
  editReason: string;
  isEditFolderOpen: boolean;
  editDocumentId: number | null;
  isUploadOpen: boolean;
  uploadPanelInitialValues: Partial<UploadFormValues>;
  uploadPanelLockFolderContext: boolean;
  transferModalOpen: boolean;
  transferMode: "docs" | "attachments" | null;
  transferDocIds: number[];
  transferAttachmentIds: number[];
  transferDepartmentId: number | null;
  isAttachmentPanelOpen: boolean;
  editAttachmentId: number | null;
  editAttachmentName: string;
  editAttachmentDescription: string;
  isNotesEditorOpen: boolean;
  editingNote: NoteListItem | null;
  noteImageViewerId: number | null;
  noteImageViewerTitle: string;
  noteImageViewerFilename: string;
}

/**
 * Complete folder detail page state.
 * Single source of truth for the folder detail page container.
 */
export interface FolderDetailPageState {
  t: TFunction;
  routes: typeof import("@/router/all_routes").all_routes;
  data: FolderDetailData;
  loadingState: FolderDetailLoading;
  errors: FolderDetailErrors;
  activity: FolderDetailActivity;
  selection: FolderDetailSelection;
  actions: FolderDetailActions;
  modals: FolderDetailModals;
}
