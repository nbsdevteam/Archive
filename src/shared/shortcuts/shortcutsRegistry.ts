/**
 * Shortcut key identifiers used for registration and overlay display.
 * Handlers are registered by pages that can fulfill the action (e.g. folder page registers "create-sub-document").
 */
export const SHORTCUT_KEYS = {
  NEW_DOCUMENT: "new-document",
  DOWNLOAD_DOCUMENT: "download-document",
  CREATE_SUB_DOCUMENT: "create-sub-document",
  VIEW_TRASH: "view-trash",
  REFRESH_PAGE: "refresh-page",
  CREATE_NOTE: "create-note",
  CREATE_COMPANY: "create-company",
  OPEN_FILTER: "open-filter",
} as const;

export type ShortcutKeyId = (typeof SHORTCUT_KEYS)[keyof typeof SHORTCUT_KEYS];

/** Human-readable label and key combo for the overlay. */
export const SHORTCUT_LABELS: Record<ShortcutKeyId, { label: string; keys: string }> = {
  [SHORTCUT_KEYS.NEW_DOCUMENT]: { label: "New document", keys: "Alt + N" },
  [SHORTCUT_KEYS.DOWNLOAD_DOCUMENT]: { label: "Download document", keys: "Alt + D" },
  [SHORTCUT_KEYS.CREATE_SUB_DOCUMENT]: { label: "Create sub-document", keys: "Alt + S" },
  [SHORTCUT_KEYS.VIEW_TRASH]: { label: "View trash", keys: "Alt + T" },
  [SHORTCUT_KEYS.REFRESH_PAGE]: { label: "Refresh page", keys: "Alt + R" },
  [SHORTCUT_KEYS.CREATE_NOTE]: { label: "Create note", keys: "Alt + C" },
  [SHORTCUT_KEYS.CREATE_COMPANY]: { label: "Create company", keys: "Ctrl + C" },
  [SHORTCUT_KEYS.OPEN_FILTER]: { label: "Filter", keys: "Alt + F" },
};

/** Single key (without Alt) that triggers the shortcut when overlay is shown or when Alt was pressed. */
export const SHORTCUT_TRIGGER_KEYS: Record<ShortcutKeyId, string> = {
  [SHORTCUT_KEYS.NEW_DOCUMENT]: "n",
  [SHORTCUT_KEYS.DOWNLOAD_DOCUMENT]: "d",
  [SHORTCUT_KEYS.CREATE_SUB_DOCUMENT]: "s",
  [SHORTCUT_KEYS.VIEW_TRASH]: "t",
  [SHORTCUT_KEYS.REFRESH_PAGE]: "r",
  [SHORTCUT_KEYS.CREATE_NOTE]: "c",
  [SHORTCUT_KEYS.CREATE_COMPANY]: "c",
  [SHORTCUT_KEYS.OPEN_FILTER]: "f",
};
