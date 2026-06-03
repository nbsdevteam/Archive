/** Form values for the edit document side panel (metadata + optional replace file fields). */
export type EditDocumentFormValues = {
  title: string;
  department_id: number;
  document_type_id: number;
  confidentiality_level: "internal" | "public" | "confidential" | "strict";
  folder_id?: number;
  po_number?: string;
  bl_number?: string;
  container_number?: string;
  invoice_number?: string;
  envoy_number?: string;
  tags?: number[];
  /** dd-mm-yyyy from text date field; empty means clear when saving. */
  document_date?: string;
  /** Optional expiry date as dd-mm-yyyy. */
  expiry_date?: string;
  /** Days before expiry to remind. */
  reminder_days?: number;
  changeDescription?: string;
  /** Required when document is locked and user selects a replacement file. */
  unlockToken?: string;
};

export interface EditDocumentSidePanelProps {
  isOpen: boolean;
  documentId: number | null;
  /** When editing from folder context (e.g. folder detail page), pass the current folder id so "Link to folder" can be prefilled if the API does not return folder_id. */
  initialFolderId?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}
