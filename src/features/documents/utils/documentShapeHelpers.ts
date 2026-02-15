/**
 * Backend shape helper functions.
 * Centralizes logic for reading nested/optional backend fields to avoid duplication.
 */

import type { Document, DocumentDetail } from '@/app/adapter/api/documents';

/**
 * Get document type name from backend payload.
 * Handles both flat `document_type_name` and nested `document_type.name` forms.
 */
export function getDocumentTypeName(doc: Document | DocumentDetail | null | undefined): string {
  if (!doc) return '';
  return (doc as { document_type?: { name?: string } })?.document_type?.name ?? doc.document_type_name ?? '';
}

/**
 * Get department name from backend payload.
 * Handles both flat `department_name` and nested `department.name` forms.
 */
export function getDepartmentName(doc: Document | DocumentDetail | null | undefined): string {
  if (!doc) return '';
  return (doc as { department?: { name?: string } })?.department?.name ?? doc.department_name ?? '';
}

/**
 * Get uploader name from backend payload.
 * Uses `uploader_name` field; some endpoints may use `uploader.name`.
 */
export function getUploaderName(doc: Document | DocumentDetail | null | undefined): string {
  if (!doc) return '';
  return (doc as { uploader?: { name?: string } })?.uploader?.name ?? doc.uploader_name ?? '';
}
