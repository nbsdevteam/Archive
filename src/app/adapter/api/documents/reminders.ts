/** Bulk expiry reminder operations for documents */

import apiClient from '../client';
import type { SetDocumentRemindersParams, SetDocumentRemindersResponse } from './types';

/**
 * Set reminder_days (and optional shared expiry_date) for selected documents or all active documents.
 * POST /api/documents/set-reminders
 */
export async function setDocumentReminders(
  params: SetDocumentRemindersParams
): Promise<SetDocumentRemindersResponse> {
  const response = await apiClient.post('/api/documents/set-reminders', params);
  const body = response.data as SetDocumentRemindersResponse;
  if (body?.success === false) {
    throw new Error(body.error ?? 'Failed to set document reminders');
  }
  return body;
}
