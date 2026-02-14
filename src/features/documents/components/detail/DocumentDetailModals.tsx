import type { TFunction } from "i18next";
import type { CreateNotePayload } from "@/features/notes/types/notes.types";
import { DocumentDetailModalsGroup1 } from "./DocumentDetailModalsGroup1";
import { DocumentDetailModalsGroup2 } from "./DocumentDetailModalsGroup2";

/** Full props for document detail modals (parent passes sliced props to Group1/Group2). */
export interface DocumentDetailModalsProps {
  t: TFunction;
  data: {
    docId: number | null;
    doc: { department_id?: number } | null;
    approvedRequests: Array<{ id: number; signer_name?: string }>;
    managers: Array<{ id: number; name: string; login?: string }>;
  };
  loading: {
    uploadingVersion: boolean;
    uploadingSigned: boolean;
    addingRelation: boolean;
    isUpdatingAttachment: boolean;
    isCreatingNote: boolean;
    isUpdatingNote: boolean;
  };
  modals: {
    modalUploadVersion: boolean;
    uploadVersionFile: File | null;
    uploadVersionUnlockToken: string;
    uploadVersionDescription: string;
    uploadVersionInputRef: React.RefObject<HTMLInputElement | null>;
    modalRequestSign: boolean;
    selectedSignerId: string | number;
    signMessage: string;
    modalUploadSigned: boolean;
    selectedApprovedReqId: number | null;
    signToken: string;
    signedFile: File | null;
    signedFileInputRef: React.RefObject<HTMLInputElement | null>;
    modalAddRelation: boolean;
    relatedDocId: string;
    relationNotes: string;
    editAttachmentId: number | null;
    editAttachmentName: string;
    editAttachmentDescription: string;
    isNotesEditorOpen: boolean;
    editingNote: unknown;
    noteImageViewerId: number | null;
    noteImageViewerTitle: string;
    noteImageViewerFilename: string;
  };
  actions: {
    setModalUploadVersion: (v: boolean) => void;
    setUploadVersionUnlockToken: (v: string) => void;
    setUploadVersionDescription: (v: string) => void;
    setUploadVersionFile: (f: File | null) => void;
    handleClearUploadVersionFile: () => void;
    handleUploadVersionSubmit: () => void;
    setModalRequestSign: (v: boolean) => void;
    setSelectedSignerId: React.Dispatch<React.SetStateAction<number | "">>;
    setSignMessage: (v: string) => void;
    handleCreateSignatureRequest: () => void;
    setModalUploadSigned: (v: boolean) => void;
    setSelectedApprovedReqId: (v: number | null) => void;
    setSignToken: (v: string) => void;
    setSignedFile: (f: File | null) => void;
    handleClearSignedFile: () => void;
    handleUploadSignedSubmit: () => void;
    setModalAddRelation: (v: boolean) => void;
    setRelatedDocId: (v: string) => void;
    setRelationNotes: (v: string) => void;
    handleAddRelationSubmit: () => void;
    handleCloseEditAttachment: () => void;
    setEditAttachmentName: (v: string) => void;
    setEditAttachmentDescription: (v: string) => void;
    handleConfirmEditAttachment: () => void;
    handleCloseNoteEditor: () => void;
    handleSaveNote: (payload: Omit<CreateNotePayload, "document_id">) => Promise<void>;
    handleCloseNoteImageViewer: () => void;
  };
  selection: { attachmentSelectedIds: (string | number)[] };
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
