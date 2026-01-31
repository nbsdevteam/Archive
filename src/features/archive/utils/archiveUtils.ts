/**
 * Archive utilities
 * Static mock data and helper functions
 */

import type { Document, Folder } from "../types/archive.types";

/**
 * Static mock data (current implementation)
 */
export const staticDocuments: Document[] = [
  { name: "Invoice_2024_Q1.xlsx", type: "Spreadsheet", updated: "Today" },
  { name: "Service_Agreement.pdf", type: "PDF", updated: "Yesterday" },
  { name: "Policy_Update.docx", type: "Document", updated: "2 days ago" },
  { name: "Project_Alpha_Brief.pptx", type: "Presentation", updated: "Last week" },
  { name: "Compliance_Checklist.pdf", type: "PDF", updated: "Last week" },
];

export const staticFolders: Folder[] = [
  { name: "Legal / Compliance", docs: 84, updated: "Today" },
  { name: "Finance / Invoices", docs: 142, updated: "Yesterday" },
  { name: "HR / Policies", docs: 36, updated: "2 days ago" },
  { name: "Projects / Alpha", docs: 58, updated: "3 days ago" },
  { name: "Contracts / Vendors", docs: 73, updated: "Last week" },
  { name: "Operations / SOPs", docs: 29, updated: "Last week" },
];
