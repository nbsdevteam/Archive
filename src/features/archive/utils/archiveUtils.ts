/**
 * Archive utilities
 * Static mock data and helper functions
 */

import type { Document, Folder } from "../types/archive.types";

/**
 * Static mock data (current implementation).
 * Cast to Document[] for archive UI; full API shape not required for mocks.
 */
export const staticDocuments = [
  { name: "Invoice_2024_Q1.xlsx", type: "Spreadsheet", updated: "Today" },
  { name: "Service_Agreement.pdf", type: "PDF", updated: "Yesterday" },
  { name: "Policy_Update.docx", type: "Document", updated: "2 days ago" },
  { name: "Project_Alpha_Brief.pptx", type: "Presentation", updated: "Last week" },
  { name: "Compliance_Checklist.pdf", type: "PDF", updated: "Last week" },
] as Document[];

export const staticFolders: Folder[] = [
  { id: 1, name: "Legal / Compliance", code: "LEGAL", docs: 84, updated: "Today" },
  { id: 2, name: "Finance / Invoices", code: "FIN", docs: 142, updated: "Yesterday" },
  { id: 3, name: "HR / Policies", code: "HR", docs: 36, updated: "2 days ago" },
  { id: 4, name: "Projects / Alpha", code: "ALPHA", docs: 58, updated: "3 days ago" },
  { id: 5, name: "Contracts / Vendors", code: "VENDORS", docs: 73, updated: "Last week" },
  { id: 6, name: "Operations / SOPs", code: "OPS", docs: 29, updated: "Last week" },
];
