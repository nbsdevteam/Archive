/**
 * Expiry reminder helpers: due-date evaluation and stable dismissal signatures.
 */

import type { Document } from '@/app/adapter/api/documents/types';
import { apiDocumentDateToHtmlInput } from '@/shared/utils/documents/documentDate';

/** Minimal document shape needed for reminder evaluation. */
export interface ExpiryReminderDocument {
  id: number;
  title?: string;
  name?: string;
  barcode?: string;
  expiry_date?: string | null;
  reminder_days?: number | null;
}

/** Parsed expiry at local calendar midnight; null when missing or invalid. */
export function parseExpiryDateLocal(value: string | null | undefined): Date | null {
  const iso = apiDocumentDateToHtmlInput(value);
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Today's date at local midnight for day-only comparisons. */
export function todayLocalMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Whole calendar days from today until expiry (negative when overdue).
 * Returns null when expiry is missing or invalid.
 */
export function daysUntilExpiry(expiryDate: string | null | undefined, today: Date = todayLocalMidnight()): number | null {
  const expiry = parseExpiryDateLocal(expiryDate);
  if (!expiry) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((expiry.getTime() - today.getTime()) / msPerDay);
}

/** True when document has reminder config and is inside the reminder window (including overdue). */
export function isDocumentExpiryReminderDue(
  doc: ExpiryReminderDocument,
  today: Date = todayLocalMidnight()
): boolean {
  if (doc.reminder_days == null || doc.reminder_days < 0) return false;
  if (doc.expiry_date == null || String(doc.expiry_date).trim() === '') return false;
  const remaining = daysUntilExpiry(doc.expiry_date, today);
  if (remaining == null) return false;
  return remaining <= doc.reminder_days;
}

/** Stable key for dismissal persistence; changes when expiry or reminder settings change. */
export function buildExpiryReminderDismissKey(doc: ExpiryReminderDocument): string {
  const expiry = String(doc.expiry_date ?? '').trim();
  const reminder = doc.reminder_days ?? '';
  return `${doc.id}|${expiry}|${reminder}`;
}

/** Display label for a document in grouped reminder UI. */
export function getExpiryReminderDocumentLabel(doc: ExpiryReminderDocument): string {
  return (doc.title ?? doc.name ?? doc.barcode ?? `Document ${doc.id}`).trim();
}

/** Filters documents to those with due expiry reminders. */
export function filterDueExpiryReminders<T extends ExpiryReminderDocument>(
  documents: T[],
  today: Date = todayLocalMidnight()
): T[] {
  return documents.filter((doc) => isDocumentExpiryReminderDue(doc, today));
}

/** Maps list API document to reminder evaluation shape. */
export function asExpiryReminderDocument(doc: Document): ExpiryReminderDocument {
  return {
    id: doc.id,
    title: doc.title,
    name: doc.name,
    barcode: doc.barcode,
    expiry_date: doc.expiry_date,
    reminder_days: doc.reminder_days,
  };
}
