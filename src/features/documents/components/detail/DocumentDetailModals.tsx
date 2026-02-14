import type { TFunction } from "i18next";
import type { CreateNotePayload } from "../../../notes/types/notes.types";
import { DocumentDetailModalsGroup1 } from "./DocumentDetailModalsGroup1";
import { DocumentDetailModalsGroup2 } from "./DocumentDetailModalsGroup2";

/** Props for document detail modals: modal state, actions, loading, data, and confirm dialog spread props. */
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
    isEditAttachmentModalOpen: boolean;
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

/** Renders all document detail modals (delegates to Group1 and Group2). */
export const DocumentDetailModals = (props: DocumentDetailModalsProps) => (
  <>
    <DocumentDetailModalsGroup1 {...props} />
    <DocumentDetailModalsGroup2 {...props} />
  </>
);
