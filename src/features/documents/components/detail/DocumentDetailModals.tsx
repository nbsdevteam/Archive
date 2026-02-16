import type { DocumentDetailPageState } from "@/features/documents/types/documentDetailState";
import { DocumentDetailModalsGroup1 } from "./DocumentDetailModalsGroup1";
import { DocumentDetailModalsGroup2 } from "./DocumentDetailModalsGroup2";

/**
 * Props for document detail modals.
 * Derived from DocumentDetailPageState for single source of truth.
 */
export interface DocumentDetailModalsProps {
  t: DocumentDetailPageState["t"];
  data: Pick<DocumentDetailPageState["data"], "docId" | "doc" | "approvedRequests" | "managers">;
  loading: Pick<
    DocumentDetailPageState["loading"],
    | "uploadingVersion"
    | "uploadingSigned"
    | "addingRelation"
    | "isUpdatingAttachment"
    | "isCreatingNote"
    | "isUpdatingNote"
  >;
  modals: DocumentDetailPageState["modals"];
  actions: Pick<
    DocumentDetailPageState["actions"],
    | "setModalUploadVersion"
    | "setUploadVersionUnlockToken"
    | "setUploadVersionDescription"
    | "setUploadVersionFile"
    | "handleClearUploadVersionFile"
    | "handleUploadVersionSubmit"
    | "setModalRequestSign"
    | "setSelectedSignerId"
    | "setSignMessage"
    | "handleCreateSignatureRequest"
    | "setModalUploadSigned"
    | "setSelectedApprovedReqId"
    | "setSignToken"
    | "setSignedFile"
    | "handleClearSignedFile"
    | "handleUploadSignedSubmit"
    | "setModalAddRelation"
    | "setRelatedDocId"
    | "setRelationNotes"
    | "handleAddRelationSubmit"
    | "handleCloseEditAttachment"
    | "setEditAttachmentName"
    | "setEditAttachmentDescription"
    | "handleConfirmEditAttachment"
    | "handleCloseNoteEditor"
    | "handleSaveNote"
    | "handleCloseNoteImageViewer"
  >;
  selection: Pick<DocumentDetailPageState["selection"], "attachmentSelectedIds">;
  attachmentTrashModalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading?: boolean };
  batchAttachmentTrashModalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading?: boolean };
  noteDeleteModalProps: { isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading?: boolean };
}

/** Narrow props for Group1: version/signature/relation/attachment edit modals and confirm dialogs. */
export type DocumentDetailModalsGroup1Props = Pick<
  DocumentDetailModalsProps,
  "t" | "data" | "loading" | "modals" | "actions" | "selection" | "attachmentTrashModalProps" | "batchAttachmentTrashModalProps" | "noteDeleteModalProps"
>;

/** Narrow props for Group2: edit attachment, note editor, note image viewer. */
export type DocumentDetailModalsGroup2Props = Pick<
  DocumentDetailModalsProps,
  "t" | "data" | "loading" | "modals" | "actions"
>;

/** Renders all document detail modals (delegates to Group1 and Group2 with same props). */
export const DocumentDetailModals = (props: DocumentDetailModalsProps) => (
  <>
    <DocumentDetailModalsGroup1 {...(props as DocumentDetailModalsGroup1Props)} />
    <DocumentDetailModalsGroup2 {...(props as DocumentDetailModalsGroup2Props)} />
  </>
);
