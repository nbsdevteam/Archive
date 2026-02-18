import type { TFunction } from "i18next";
import type { DocumentDetail, DocumentVersion, Attachment } from "@/app/adapter/api/documents.api";
import type { ActivityViewMode } from "@/features/activity/types/auditLogs.types";
import type { NoteListItem } from "@/features/notes/types/notes.types";
import type { CreateNotePayload } from "@/features/notes/types/notes.types";

/** Manager object from admin API */
export interface Manager {
  id: number;
  name: string;
  login?: string;
}

/** Document relations structure */
export interface DocumentRelations {
  parent?: { id: number; title: string; barcode?: string } | null;
  related?: Array<{ id: number; title: string; barcode?: string; notes?: string }>;
}

/** Signature request row for display */
export interface SignatureRow {
  id: number;
  state?: string;
  signer_name?: string;
  request_date?: string | null;
}

/** Approved signature request */
export interface ApprovedRequest {
  id: number;
  signer_name?: string;
}

/**
 * Document detail page data slice.
 * Contains all derived/fetched data for the document.
 */
export interface DocumentDetailData {
  docId: number | null;
  doc: (DocumentDetail & { department_id?: number }) | null;
  title: string;
  documentTypeName: string;
  departmentName: string;
  uploaderName: string;
  versions: DocumentVersion[];
  tags: Array<{ id: number; name: string }>;
  ocr: unknown;
  ocrStatus: string;
  fileName: string | null | undefined;
  isOcrSupported: boolean;
  latestVersionId: number | null | undefined;
  signatureRows: SignatureRow[];
  approvedRequests: ApprovedRequest[];
  isArchived: boolean;
  isTrashed: boolean;
  isAdmin: boolean;
  canRequestSignature: boolean;
  attachments: Attachment[];
  relations: DocumentRelations;
  auditLogs: unknown[] | Array<{ id?: string; [key: string]: unknown }>;
  managers: Manager[];
  notes: NoteListItem[];
}

/**
 * Document detail page loading states.
 * Tracks async operation progress.
 */
export interface DocumentDetailLoading {
  isLoading: boolean;
  loadingAttachments: boolean;
  loadingRelations: boolean;
  loadingAudit: boolean;
  loadingNotes: boolean;
  isTrashing: boolean;
  isRestoring: boolean;
  isPermanentDeleting: boolean;
  isDeletingAttachment: boolean;
  isUpdatingAttachment: boolean;
  uploadingVersion: boolean;
  uploadingSigned: boolean;
  addingRelation: boolean;
  runOcrLoading: boolean;
  isCreatingNote: boolean;
  isUpdatingNote: boolean;
  isDeletingNote: boolean;
}

/**
 * Document detail page error states.
 * Stores error messages from various operations.
 */
export interface DocumentDetailError {
  storeError: string | null;
  auditError: string | null;
  notesError: string | null | undefined;
}

/**
 * Document detail tab state.
 * Manages active tab and view mode.
 */
export interface DocumentDetailTabState {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  activityViewMode: ActivityViewMode;
  setActivityViewMode: React.Dispatch<React.SetStateAction<ActivityViewMode>>;
  auditRefresh: () => void;
}

/**
 * Document detail selection state.
 * Manages attachment selection for batch operations.
 */
export interface DocumentDetailSelection {
  attachmentSelectedIds: (string | number)[];
  attachmentSelectionConfig: {
    isAllSelected: boolean;
    isIndeterminate: boolean;
    selectedIds: (string | number)[];
    onToggle: (id: string | number) => void;
    onToggleAll: () => void;
  } | null;
}

/**
 * Document detail actions.
 * All handler functions for user interactions.
 */
export interface DocumentDetailActions {
  formatDate: (date?: string) => string;
  refreshAttachments: () => void;
  confirmAttachmentTrash: (attachmentId: number) => Promise<void>;
  confirmBatchAttachmentTrash: () => Promise<void>;
  handleClearUploadVersionFile: () => void;
  handleClearSignedFile: () => void;
  handleDownloadVersion: (id: number, fileName: string) => void;
  handleDownloadCurrent: () => void;
  handleDownloadAttachment: (id: number, fileName: string) => Promise<void>;
  handleOpenEditAttachment: (id: number) => void;
  handleCloseEditAttachment: () => void;
  handleConfirmEditAttachment: (replaceFile?: File | null) => Promise<void>;
  handleCloseAttachmentPanel: () => void;
  openAddAttachmentPanel: () => void;
  handleViewAttachment: (id: number) => void;
  handleOpenEdit: () => void;
  handleCloseEdit: () => void;
  handleEditSuccess: () => void;
  /** Refetches the current document from the API (e.g. after stale prefetched state or user request). */
  handleRefreshDocument: () => Promise<void>;
  handleArchive: () => Promise<void>;
  handleUnarchive: () => Promise<void>;
  handleRunOcr: () => Promise<void>;
  handleTrashDocument: () => Promise<void>;
  handleRestoreDocument: () => Promise<void>;
  handlePermanentDelete: () => Promise<void>;
  handleUploadVersionSubmit: () => Promise<void>;
  handleCreateSignatureRequest: () => Promise<void>;
  handleUploadSignedSubmit: () => Promise<void>;
  handleAddRelationSubmit: () => Promise<void>;
  handleSetParent: (parentId: number | null) => Promise<void>;
  handleCreateNote: () => void;
  handleEditNote: (note: NoteListItem) => void;
  handleCloseNoteEditor: () => void;
  handleSaveNote: (payload: Omit<CreateNotePayload, "document_id" | "folder_id">) => Promise<void>;
  confirmDeleteNote: (noteId: number) => Promise<void>;
  handleViewNoteImage: (note: NoteListItem) => void;
  handleCloseNoteImageViewer: () => void;
  setIsAddAttachmentPanelOpen: (v: boolean) => void;
  setModalUploadVersion: (v: boolean) => void;
  setUploadVersionFile: (f: File | null) => void;
  setUploadVersionUnlockToken: (v: string) => void;
  setUploadVersionDescription: (v: string) => void;
  setModalRequestSign: (v: boolean) => void;
  setSelectedSignerId: React.Dispatch<React.SetStateAction<number | "">>;
  setSignMessage: (v: string) => void;
  setModalUploadSigned: (v: boolean) => void;
  setSelectedApprovedReqId: (v: number | null) => void;
  setSignToken: (v: string) => void;
  setSignedFile: (f: File | null) => void;
  setModalAddRelation: (v: boolean) => void;
  setRelatedDocId: (v: string) => void;
  setRelationNotes: (v: string) => void;
  setModalTrashConfirm: (v: boolean) => void;
  setModalPermanentDelete: (v: boolean) => void;
  setEditAttachmentName: (v: string) => void;
  setEditAttachmentDescription: (v: string) => void;
}

/**
 * Document detail modal states.
 * Manages visibility and form state for all modals.
 */
export interface DocumentDetailModals {
  isAddAttachmentPanelOpen: boolean;
  editDocumentId: number | null;
  modalUploadVersion: boolean;
  uploadVersionFile: File | null;
  uploadVersionUnlockToken: string;
  uploadVersionDescription: string;
  uploadingVersion: boolean;
  uploadVersionInputRef: React.RefObject<HTMLInputElement | null>;
  modalRequestSign: boolean;
  selectedSignerId: string | number;
  signMessage: string;
  modalUploadSigned: boolean;
  selectedApprovedReqId: number | null;
  signToken: string;
  signedFile: File | null;
  uploadingSigned: boolean;
  signedFileInputRef: React.RefObject<HTMLInputElement | null>;
  modalAddRelation: boolean;
  relatedDocId: string;
  relationNotes: string;
  addingRelation: boolean;
  modalTrashConfirm: boolean;
  modalPermanentDelete: boolean;
  editAttachmentId: number | null;
  editAttachmentName: string;
  editAttachmentDescription: string;
  isTrashing: boolean;
  isRestoring: boolean;
  isPermanentDeleting: boolean;
  isDeletingAttachment: boolean;
  isUpdatingAttachment: boolean;
  isNotesEditorOpen: boolean;
  editingNote: NoteListItem | null;
  isCreatingNote: boolean;
  isUpdatingNote: boolean;
  isDeletingNote: boolean;
  noteImageViewerId: number | null;
  noteImageViewerTitle: string;
  noteImageViewerFilename: string;
}

/**
 * Complete document detail page state.
 * Single source of truth for the document detail page container.
 */
export interface DocumentDetailPageState {
  t: TFunction;
  routes: typeof import("@/router/all_routes").all_routes;
  data: DocumentDetailData;
  loading: DocumentDetailLoading;
  error: DocumentDetailError;
  tabState: DocumentDetailTabState;
  selection: DocumentDetailSelection;
  actions: DocumentDetailActions;
  modals: DocumentDetailModals;
}
