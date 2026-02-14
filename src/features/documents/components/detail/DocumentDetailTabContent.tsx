import type { TFunction } from "i18next";
import type { ActivityViewMode } from "@/features/activity/types/auditLogs.types";
import type { NoteListItem } from "@/features/notes/types/notes.types";
import { DocumentDetailTabsGroup1 } from "./DocumentDetailTabsGroup1";
import { DocumentDetailTabsGroup2 } from "./DocumentDetailTabsGroup2";

/** Tab state from document detail container (tab list, active id, setters, audit view mode). */
export interface DocumentDetailTabState {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  activityViewMode: ActivityViewMode;
  setActivityViewMode: React.Dispatch<React.SetStateAction<ActivityViewMode>>;
  auditRefresh: () => void;
}

/** Props for document detail tab content: data/loading/error/tabState/selection/actions from container + confirm dialogs. */
export interface DocumentDetailTabContentProps {
  t: TFunction;
  tabState: DocumentDetailTabState;
  data: {
    doc: { id: number; department_id?: number } | null;
    fileName: string | null | undefined;
    latestVersionId: number | null | undefined;
    versions: Array<{ id: number; version_number: number; file_name: string; upload_date?: string; uploaded_by?: string }>;
    attachments: Array<{ id: number; name: string; file_name: string; description?: string | null }>;
    notes: unknown[];
    ocr: unknown;
    ocrStatus: string;
    isOcrSupported: boolean;
    signatureRows: Array<{ id: number; state?: string; signer_name?: string; request_date?: string | null }>;
    approvedRequests: Array<{ id: number; signer_name?: string }>;
    canRequestSignature: boolean;
    relations: { parent?: { id: number; title: string; barcode?: string } | null; related?: Array<{ id: number; title: string; barcode?: string; notes?: string }> };
    auditLogs: unknown[] | Array<{ id?: string; [key: string]: unknown }>;
  };
  loading: {
    loadingAttachments: boolean;
    loadingRelations: boolean;
    loadingNotes: boolean;
    runOcrLoading: boolean;
    loadingAudit: boolean;
    isDeletingAttachment?: boolean;
  };
  error: { auditError: string | null; notesError: string | null | undefined };
  selection: {
    attachmentSelectedIds: (string | number)[];
    attachmentSelectionConfig: {
      isAllSelected: boolean;
      isIndeterminate: boolean;
      selectedIds: (string | number)[];
      onToggle: (id: string | number) => void;
      onToggleAll: () => void;
    } | null;
  };
  actions: {
    formatDate: (date?: string) => string;
    setModalUploadVersion: (v: boolean) => void;
    handleDownloadVersion: (id: number, fileName: string) => void;
    handleDownloadCurrent: () => void;
    setIsAddAttachmentPanelOpen: (v: boolean) => void;
    openAddAttachmentPanel: () => void;
    handleViewAttachment: (id: number) => void;
    handleDownloadAttachment: (id: number, fileName: string) => void;
    handleOpenEditAttachment: (id: number) => void;
    handleCreateNote: () => void;
    handleEditNote: (note: NoteListItem) => void;
    handleViewNoteImage: (note: NoteListItem) => void;
    handleRunOcr: () => void;
    setModalRequestSign: (v: boolean) => void;
    setModalUploadSigned: (v: boolean) => void;
    setModalAddRelation: (v: boolean) => void;
    handleSetParent: (parentId: number | null) => void;
  };
  attachmentTrashDialog: { open: (id: number) => void };
  batchAttachmentTrashDialog: { open: () => void };
  noteDeleteDialog: { open: (id: number) => void };
}

const TAB_GROUP_1 = ["preview", "download", "versions", "attachments"];
const TAB_GROUP_2 = ["notes", "ocr", "signatures", "relations", "audit"];

/** Renders the active tab content for document detail (delegates to Group1 or Group2). */
export const DocumentDetailTabContent = (props: DocumentDetailTabContentProps) => {
  const { tabState } = props;
  return (
    <>
      {TAB_GROUP_1.includes(tabState.activeTab) && <DocumentDetailTabsGroup1 {...props} />}
      {TAB_GROUP_2.includes(tabState.activeTab) && <DocumentDetailTabsGroup2 {...props} />}
    </>
  );
};
