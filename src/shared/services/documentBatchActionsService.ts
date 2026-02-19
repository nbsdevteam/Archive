/**
 * Document batch-action visibility service (pure, framework-agnostic).
 *
 * HOW IT WORKS:
 * - "Common-only" rule: a batch action is shown only if it is valid for EVERY selected document.
 *   We take the intersection of per-document allowed actions so the toolbar never offers an action
 *   that would fail or be invalid for some selected items.
 * - Status normalization: API status strings are mapped to four kinds (active | archived | trashed | unknown)
 *   so action rules are consistent across list, archived, and trash pages.
 * - Main-document constraints: Transfer and Trash are allowed only for sub-documents (is_main_document !== true).
 *   Main documents cannot be moved or trashed in batch to avoid orphaned folders.
 *
 * CONSUMERS: Documents list, Archived list, Trash list, and Folder detail (sub-docs/attachments) call
 * getAllowedBatchActionsForDocumentsSelection(documents, selectedIds) and use the returned booleans
 * to show/hide batch buttons and wire confirm handlers.
 */

export type DocumentStatusKind = "active" | "archived" | "trashed" | "unknown";

/** Minimal document shape needed to compute batch actions (id, status, main-doc flag). */
export interface DocumentForBatchActions {
  id: number;
  status?: string | null;
  is_main_document?: boolean;
}

/** Result of allowed batch actions for a selection (intersection across all selected docs). */
export interface DocumentBatchActionsResult {
  canBatchTransfer: boolean;
  canBatchArchive: boolean;
  canBatchTrash: boolean;
  canBatchRestore: boolean;
  canBatchUnarchive: boolean;
}

/**
 * Normalizes API status into one of four kinds for action rules.
 * Trashed: status contains "trash" or "deleted"; Archived: "archived"; Active: "active"; else unknown.
 */
export function getDocumentStatusKind(status?: string | null): DocumentStatusKind {
  const s = (status ?? "").toLowerCase().trim();
  if (s.includes("trash") || s.includes("deleted")) return "trashed";
  if (s === "archived") return "archived";
  if (s === "active") return "active";
  return "unknown";
}

/**
 * Returns the set of batch actions allowed for a single document.
 * Trigger: used once per selected doc when computing intersection.
 * Safety: main docs never get Transfer/Trash; trashed only Restore; archived get Unarchive (+ Trash if subdoc).
 */
function getAllowedActionsForDocument(doc: DocumentForBatchActions): Set<keyof DocumentBatchActionsResult> {
  const kind = getDocumentStatusKind(doc.status);
  const isSubdoc = doc.is_main_document !== true;
  const allowed = new Set<keyof DocumentBatchActionsResult>();

  switch (kind) {
    case "trashed":
      allowed.add("canBatchRestore");
      break;
    case "active":
      if (isSubdoc) allowed.add("canBatchTransfer");
      allowed.add("canBatchArchive");
      if (isSubdoc) allowed.add("canBatchTrash");
      break;
    case "archived":
      allowed.add("canBatchUnarchive");
      if (isSubdoc) allowed.add("canBatchTrash");
      break;
    case "unknown":
      break;
  }
  return allowed;
}

/**
 * Computes which batch actions are allowed for the current selection (common-only intersection).
 * Trigger: called from containers when selection or document list changes; result drives toolbar visibility.
 * Success: returns an object with true only for actions that every selected document supports.
 */
export function getAllowedBatchActionsForDocumentsSelection(
  documents: DocumentForBatchActions[],
  selectedIds: number[]
): DocumentBatchActionsResult {
  const defaultResult: DocumentBatchActionsResult = {
    canBatchTransfer: false,
    canBatchArchive: false,
    canBatchTrash: false,
    canBatchRestore: false,
    canBatchUnarchive: false,
  };

  if (selectedIds.length === 0) return defaultResult;

  const docMap = new Map(documents.map((d) => [d.id, d]));
  const selectedDocs = selectedIds
    .map((id) => docMap.get(id))
    .filter((d): d is DocumentForBatchActions => d != null);

  if (selectedDocs.length === 0) return defaultResult;

  const actionKeys: (keyof DocumentBatchActionsResult)[] = [
    "canBatchTransfer",
    "canBatchArchive",
    "canBatchTrash",
    "canBatchRestore",
    "canBatchUnarchive",
  ];

  const firstAllowed = getAllowedActionsForDocument(selectedDocs[0]);
  const intersection = actionKeys.filter((key) => {
    if (!firstAllowed.has(key)) return false;
    return selectedDocs.every((doc) => getAllowedActionsForDocument(doc).has(key));
  });

  const result = { ...defaultResult };
  intersection.forEach((key) => {
    result[key] = true;
  });
  return result;
}
