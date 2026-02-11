/**
 * Notes API module
 * Aligned with NOTES_SYSTEM_API_DOCUMENTATION.md
 * 
 * Note: This API uses a mix of JSON-RPC and plain HTTP:
 * - List and Get use JSON-RPC (POST with jsonrpc envelope)
 * - Create and Update use plain JSON (POST with direct payload)
 * - Delete uses HTTP DELETE
 */

import { jsonRpcRequest, httpRequest, httpDelete } from '../../../shared/lib/http';
import type {
  ListNotesParams,
  NotesListResponse,
  NoteDetailResponse,
  CreateNotePayload,
  UpdateNotePayload,
  NoteMutationResponse,
} from '../types/notes.types';

/**
 * List notes with optional filters
 * POST /api/notes (JSON-RPC)
 * 
 * @param params - Filter params (document_id, folder_id, user_id, include_private, page, per_page)
 * @returns List of notes with pagination
 */
export const listNotes = async (
  params: ListNotesParams = {}
): Promise<NotesListResponse> => {
  const result = await jsonRpcRequest<NotesListResponse>('/api/notes', {
    document_id: params.document_id,
    folder_id: params.folder_id,
    user_id: params.user_id,
    include_private: params.include_private ?? true,
    page: params.page ?? 1,
    per_page: params.per_page ?? 50,
  });

  // Handle different response shapes
  if (typeof result === 'object' && result !== null) {
    if ('success' in result && 'data' in result) {
      return result as NotesListResponse;
    }
    // If backend returns array directly, wrap it
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
      };
    }
  }

  return {
    success: false,
    data: [],
  };
};

/**
 * Get single note by ID (includes full base64 image if present)
 * POST /api/notes/<note_id> (JSON-RPC)
 * 
 * @param noteId - Note ID
 * @returns Note detail with image
 */
export const getNote = async (noteId: number): Promise<NoteDetailResponse> => {
  const result = await jsonRpcRequest<NoteDetailResponse | { success?: boolean; data?: unknown }>(
    `/api/notes/${noteId}`,
    {}
  );

  if (typeof result === 'object' && result !== null && 'data' in result && result.data) {
    return result as NoteDetailResponse;
  }

  // If backend returns note directly
  if (typeof result === 'object' && result !== null && 'id' in result) {
    return {
      success: true,
      data: result as NoteDetailResponse['data'],
    };
  }

  throw new Error('Failed to fetch note');
};

/**
 * Create a new note
 * POST /api/notes/create (plain JSON, NOT JSON-RPC)
 * 
 * @param payload - Note data (content required, title/image/links optional)
 * @returns Created note ID and timestamp
 */
export const createNote = async (
  payload: CreateNotePayload
): Promise<NoteMutationResponse> => {
  const result = await httpRequest<NoteMutationResponse['data']>(
    '/api/notes/create',
    payload
  );

  // httpRequest returns ApiResponse<T>, extract it
  if (typeof result === 'object' && result !== null) {
    if ('success' in result) {
      return result as NoteMutationResponse;
    }
    // Wrap if backend returns raw data
    return {
      success: true,
      data: result as NoteMutationResponse['data'],
    };
  }

  throw new Error('Failed to create note');
};

/**
 * Update an existing note
 * POST /api/notes/<note_id>/update (plain JSON, NOT JSON-RPC)
 * 
 * Note: Only the creator can update the note
 * 
 * @param noteId - Note ID
 * @param payload - Fields to update
 * @returns Update confirmation
 */
export const updateNote = async (
  noteId: number,
  payload: UpdateNotePayload
): Promise<NoteMutationResponse> => {
  const result = await httpRequest<NoteMutationResponse['data']>(
    `/api/notes/${noteId}/update`,
    payload
  );

  if (typeof result === 'object' && result !== null) {
    if ('success' in result) {
      return result as NoteMutationResponse;
    }
    return {
      success: true,
      data: result as NoteMutationResponse['data'],
    };
  }

  throw new Error('Failed to update note');
};

/**
 * Delete a note (soft delete: sets active=False)
 * DELETE /api/notes/<note_id> (HTTP DELETE)
 * 
 * Note: Only the creator or admin can delete
 * 
 * @param noteId - Note ID
 * @returns Deletion confirmation
 */
export const deleteNote = async (noteId: number): Promise<{ success: boolean; message?: string }> => {
  const result = await httpDelete<{ success?: boolean; message?: string; error?: string }>(
    `/api/notes/${noteId}`
  );

  if (result && typeof result === 'object') {
    if (result.success === false || result.error) {
      throw new Error(result.error ?? result.message ?? 'Failed to delete note');
    }
    return {
      success: true,
      message: result.message,
    };
  }

  return { success: true };
};
