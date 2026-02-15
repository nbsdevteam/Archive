/**
 * @deprecated This file is maintained for backward compatibility only.
 * Import from '@/app/adapter/api/documents' instead.
 * 
 * Old: import { documentsApi } from '@/app/adapter/api/documents.api'
 * New: import { getDocument, updateDocument, ... } from '@/app/adapter/api/documents'
 * Or use documentsApi object: import { documentsApi } from '@/app/adapter/api/documents'
 */

// Re-export everything from the domain modules
export * from './documents';
export { documentsApi, clearDocumentPreviewCache } from './documents';

// For full backward compatibility, also export as default
import { documentsApi } from './documents';
export default documentsApi;
