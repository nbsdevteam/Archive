import { queryClient } from "./queryClient";
import { queryKeys } from "./queryKeys";

/**
 * The API uses POST for many reads, so writes cannot be detected at the HTTP layer: every write
 * calls one of these. Mounted queries refetch; unmounted ones are marked stale and refetch on return.
 */

/** A document changed (upload, edit, archive, trash, restore, delete, move, reminders). */
export function invalidateDocumentData(): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.documents.all }),
    // Folder cards show document counts; the dashboard shows totals; both change with documents.
    queryClient.invalidateQueries({ queryKey: queryKeys.folders.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.audit.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.search.all }),
  ]);
}

/** A folder changed (create, edit, delete). */
export function invalidateFolderData(): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.folders.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.audit.all }),
  ]);
}

export function invalidateNotes(): Promise<unknown> {
  return queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
}

export function invalidateCompanies(): Promise<unknown> {
  return queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
}
