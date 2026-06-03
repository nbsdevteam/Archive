import { describe, expect, it } from 'vitest';
import {
  buildExpiryReminderDismissKey,
  daysUntilExpiry,
  filterDueExpiryReminders,
  isDocumentExpiryReminderDue,
} from './expiryReminder';

describe('expiryReminder', () => {
  const today = new Date(2026, 5, 3); // 3 Jun 2026 local

  it('returns days until expiry at date-only granularity', () => {
    expect(daysUntilExpiry('05-06-2026', today)).toBe(2);
    expect(daysUntilExpiry('03-06-2026', today)).toBe(0);
    expect(daysUntilExpiry('01-06-2026', today)).toBe(-2);
  });

  it('marks reminder due when within reminder_days window', () => {
    expect(
      isDocumentExpiryReminderDue({ id: 1, expiry_date: '05-06-2026', reminder_days: 7 }, today)
    ).toBe(true);
    expect(
      isDocumentExpiryReminderDue({ id: 1, expiry_date: '20-06-2026', reminder_days: 7 }, today)
    ).toBe(false);
  });

  it('shows immediately when expiry is inside reminder window (2 days left, 7-day reminder)', () => {
    const doc = { id: 1, expiry_date: '05-06-2026', reminder_days: 7 };
    expect(isDocumentExpiryReminderDue(doc, today)).toBe(true);
    expect(filterDueExpiryReminders([doc], today)).toHaveLength(1);
  });

  it('builds stable dismissal keys from id, expiry, and reminder_days', () => {
    expect(buildExpiryReminderDismissKey({ id: 5, expiry_date: '31-12-2026', reminder_days: 30 })).toBe(
      '5|31-12-2026|30'
    );
  });

  it('ignores docs without expiry or reminder_days', () => {
    expect(isDocumentExpiryReminderDue({ id: 1, expiry_date: null, reminder_days: 7 }, today)).toBe(false);
    expect(isDocumentExpiryReminderDue({ id: 1, expiry_date: '05-06-2026', reminder_days: null }, today)).toBe(
      false
    );
  });
});
