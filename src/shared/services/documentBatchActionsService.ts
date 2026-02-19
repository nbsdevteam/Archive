/**
 * Shared service for document batch-action visibility rules.
 * Pure, framework-agnostic: computes which bulk actions are allowed for a selection
 * using "common-only" logic (action shown only if valid for ALL selected documents).
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
 * Normalizes document status into one of four kinds for action rules.
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
 * Returns the set of batch actions allowed for a single document (by status and main-doc flag).
 * Used internally to compute intersection across selection.
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
 * Computes which batch actions are allowed for the current selection using common-only logic.
 * An action is allowed only if every selected document can perform it.
 *
 * @param documents - Full list of documents (or map) to resolve selected ids
 * @param selectedIds - Ids of currently selected documents
 * @returns Object with booleans for each batch action
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
