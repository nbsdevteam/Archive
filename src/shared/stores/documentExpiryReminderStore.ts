import { create } from 'zustand';

const DISMISSED_EXPIRY_REMINDERS_KEY = 'dismissed-expiry-reminder-keys';

/** Reads dismissed reminder signature keys from localStorage. */
const readDismissedKeys = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DISMISSED_EXPIRY_REMINDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
};

/** Persists dismissed reminder signature keys to localStorage. */
const persistDismissedKeys = (keys: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DISMISSED_EXPIRY_REMINDERS_KEY, JSON.stringify([...new Set(keys)]));
  } catch {
    // Ignore storage write failures.
  }
};

interface DocumentExpiryReminderState {
  dismissedKeys: string[];
  isDismissed: (key: string) => boolean;
  dismissKeys: (keys: string[]) => void;
  /** Rehydrates from localStorage (e.g. after storage event from another tab). */
  syncFromStorage: () => void;
}

/** Tracks user-dismissed expiry reminder signatures across reloads and tabs. */
export const useDocumentExpiryReminderStore = create<DocumentExpiryReminderState>((set, get) => ({
  dismissedKeys: readDismissedKeys(),
  isDismissed: (key) => get().dismissedKeys.includes(key),
  dismissKeys: (keys) => {
    const next = [...new Set([...get().dismissedKeys, ...keys])];
    persistDismissedKeys(next);
    set({ dismissedKeys: next });
  },
  syncFromStorage: () => {
    set({ dismissedKeys: readDismissedKeys() });
  },
}));

export { DISMISSED_EXPIRY_REMINDERS_KEY };
