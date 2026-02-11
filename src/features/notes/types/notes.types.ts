/**
 * Notes feature types
 * Aligned with NOTES_SYSTEM_API_DOCUMENTATION.md
 */

/** Color codes for notes (0-9) */
export type NoteColorCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Color mapping (per API doc) */
export const NOTE_COLOR_NAMES: Record<NoteColorCode, string> = {
  0: 'Default',
  1: 'Red',
  2: 'Blue',
  3: 'Green',
  4: 'Yellow',
  5: 'Orange',
  6: 'Purple',
  7: 'Pink',
  8: 'Brown',
  9: 'Gray',
};

/** List item response from POST /api/notes (does NOT include full image) */
export interface NoteListItem {
  id: number;
  title?: string;
  content: string;
  user_id: number;
  user_name: string;
  document_id?: number;
  document_title?: string;
  folder_id?: number;
  folder_name?: string;
  department_id?: number;
  department_name?: string;
  has_image: boolean;
  image_filename?: string;
  is_private: boolean;
  is_pinned: boolean;
  color: NoteColorCode;
  created_at: string;
  updated_at: string;
}

/** Single note detail from POST /api/notes/<id> (includes full base64 image) */
export interface NoteDetail extends Omit<NoteListItem, 'has_image'> {
  /** Base64-encoded image (only returned by get-single, NOT by list) */
  image?: string;
}

/** List notes API params (JSON-RPC) */
export interface ListNotesParams {
  document_id?: number;
  folder_id?: number;
  user_id?: number | null;
  include_private?: boolean;
  page?: number;
  per_page?: number;
}

/** Create note payload (plain JSON, POST /api/notes/create) */
export interface CreateNotePayload {
  content: string;
  title?: string;
  document_id?: number;
  folder_id?: number;
  department_id?: number;
  /** Base64-encoded image string */
  image?: string;
  image_filename?: string;
  is_private?: boolean;
  is_pinned?: boolean;
  color?: NoteColorCode;
}

/** Update note payload (plain JSON, POST /api/notes/<id>/update) */
export interface UpdateNotePayload {
  title?: string;
  content?: string;
  is_private?: boolean;
  is_pinned?: boolean;
  color?: NoteColorCode;
  /** Base64-encoded new image */
  image?: string;
  image_filename?: string;
}

/** List notes response (JSON-RPC) */
export interface NotesListResponse {
  success: boolean;
  data: NoteListItem[];
  pagination?: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

/** Single note response (JSON-RPC) */
export interface NoteDetailResponse {
  success: boolean;
  data: NoteDetail;
}

/** Create/update note response (plain JSON) */
export interface NoteMutationResponse {
  success: boolean;
  message?: string;
  data?: {
    id?: number;
    created_at?: string;
    updated_at?: string;
  };
  error?: string;
}

/**
 * Convert base64 image to data URL for rendering in <img> tags.
 * Infers MIME type from filename extension (defaults to image/png).
 */
export function base64ImageToDataUrl(imageBase64: string, imageFilename?: string): string {
  if (!imageBase64) return '';
  
  const ext = (imageFilename?.split('.').pop() ?? '').toLowerCase();
  let mimeType = 'image/png';
  
  if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
  else if (ext === 'gif') mimeType = 'image/gif';
  else if (ext === 'webp') mimeType = 'image/webp';
  else if (ext === 'svg') mimeType = 'image/svg+xml';
  else if (ext === 'bmp') mimeType = 'image/bmp';
  
  return `data:${mimeType};base64,${imageBase64}`;
}
