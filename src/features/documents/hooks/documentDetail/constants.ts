/**
 * Document detail tab constants.
 * Centralized tab IDs for consistency across components and hooks.
 */

/** Document detail tab IDs */
export const DOCUMENT_DETAIL_TAB_IDS = {
  /** Group 1: preview/download/versions/attachments/notes/ocr */
  PREVIEW: 'preview',
  DOWNLOAD: 'download',
  VERSIONS: 'versions',
  ATTACHMENTS: 'attachments',
  NOTES: 'notes',
  OCR: 'ocr',
  
  /** Group 2: signatures/relations/audit */
  SIGNATURES: 'signatures',
  RELATIONS: 'relations',
  AUDIT: 'audit',
} as const;

/** Type for tab IDs (inferred from constant) */
export type DocumentDetailTabId = typeof DOCUMENT_DETAIL_TAB_IDS[keyof typeof DOCUMENT_DETAIL_TAB_IDS];

/** Tabs rendered in first group (left side) */
export const TAB_GROUP_1 = [
  DOCUMENT_DETAIL_TAB_IDS.PREVIEW,
  DOCUMENT_DETAIL_TAB_IDS.DOWNLOAD,
  DOCUMENT_DETAIL_TAB_IDS.VERSIONS,
  DOCUMENT_DETAIL_TAB_IDS.ATTACHMENTS,
  DOCUMENT_DETAIL_TAB_IDS.NOTES,
  DOCUMENT_DETAIL_TAB_IDS.OCR,
] as const;

/** Tabs rendered in second group (right side) */
export const TAB_GROUP_2 = [
  DOCUMENT_DETAIL_TAB_IDS.SIGNATURES,
  DOCUMENT_DETAIL_TAB_IDS.RELATIONS,
  DOCUMENT_DETAIL_TAB_IDS.AUDIT,
] as const;
