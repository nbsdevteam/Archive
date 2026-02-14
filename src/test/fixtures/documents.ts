import type { Document } from "../../app/adapter/api/documents.api";

/**
 * Builds a Document fixture for tests. Override any fields via partial.
 */
export function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 1,
    title: "Test Document",
    department_id: 10,
    department_name: "Engineering",
    document_type_id: 1,
    document_type_name: "Contract",
    uploader_id: 1,
    uploader_name: "Test User",
    upload_date: "2024-01-15T10:00:00Z",
    status: "active",
    confidentiality_level: "internal",
    barcode: "DOC-001",
    file_name: "test-doc.pdf",
    file_size: 1024,
    ...overrides,
  };
}
