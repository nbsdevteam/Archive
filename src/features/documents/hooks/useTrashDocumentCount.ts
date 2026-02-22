/**
 * Re-export from shared so documents feature keeps same API; implementation lives in shared
 * so Dashboard does not pull the feature-documents chunk.
 */
export { useTrashDocumentCount } from "../../../shared/hooks/useTrashDocumentCount";
