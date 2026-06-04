import type { DocumentBatchActionsResult } from "../services/documentBatchActionsService";

/**
 * Hides batch trash when the current user lacks can_delete_files.
 */
export function gateBatchActionsForDelete(
  actions: DocumentBatchActionsResult,
  canDeleteFiles: boolean,
): DocumentBatchActionsResult {
  if (canDeleteFiles) return actions;
  return { ...actions, canBatchTrash: false };
}
