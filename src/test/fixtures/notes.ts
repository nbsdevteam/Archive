import type { NoteListItem } from "../../features/notes/types/notes.types";

/**
 * Builds a NoteListItem fixture for tests. Override any fields via partial.
 */
export function makeNoteListItem(overrides: Partial<NoteListItem> = {}): NoteListItem {
  return {
    id: 1,
    title: "Test Note",
    content: "Note content",
    user_id: 1,
    user_name: "Test User",
    folder_id: 1,
    folder_name: "Test Folder",
    department_id: 10,
    department_name: "Engineering",
    has_image: false,
    is_private: false,
    is_pinned: false,
    color: 0,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}
