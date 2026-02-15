import type { TFunction } from "i18next";
import type { NoteListItem } from "@/features/notes/types/notes.types";
import type { DocumentDetailPageState } from "@/features/documents/types/documentDetailState";
import { DocumentDetailTabsGroup1 } from "./DocumentDetailTabsGroup1";
import { DocumentDetailTabsGroup2 } from "./DocumentDetailTabsGroup2";

/**
 * Props for document detail tab content.
 * Derived from DocumentDetailPageState for single source of truth.
 */
export interface DocumentDetailTabContentProps {
  t: DocumentDetailPageState["t"];
  tabState: DocumentDetailPageState["tabState"];
  data: Pick<
    DocumentDetailPageState["data"],
    | "doc"
    | "fileName"
    | "latestVersionId"
    | "versions"
    | "attachments"
    | "notes"
    | "ocr"
    | "ocrStatus"
    | "isOcrSupported"
    | "signatureRows"
    | "approvedRequests"
    | "canRequestSignature"
    | "relations"
    | "auditLogs"
  >;
  loading: Pick<
    DocumentDetailPageState["loading"],
    | "loadingAttachments"
    | "loadingRelations"
    | "loadingNotes"
    | "runOcrLoading"
    | "loadingAudit"
    | "isDeletingAttachment"
  >;
  error: DocumentDetailPageState["error"];
  selection: DocumentDetailPageState["selection"];
  actions: Pick<
    DocumentDetailPageState["actions"],
    | "formatDate"
    | "setModalUploadVersion"
    | "handleDownloadVersion"
    | "handleDownloadCurrent"
    | "setIsAddAttachmentPanelOpen"
    | "openAddAttachmentPanel"
    | "handleViewAttachment"
    | "handleDownloadAttachment"
    | "handleOpenEditAttachment"
    | "handleCreateNote"
    | "handleEditNote"
    | "handleViewNoteImage"
    | "handleRunOcr"
    | "setModalRequestSign"
    | "setModalUploadSigned"
    | "setModalAddRelation"
    | "handleSetParent"
  >;
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
