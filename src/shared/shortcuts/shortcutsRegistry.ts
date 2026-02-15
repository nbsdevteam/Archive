/**
 * Shortcut key identifiers used for registration and overlay display.
 * Handlers are registered by pages that can fulfill the action (e.g. folder page registers "create-sub-document").
 */
export const SHORTCUT_KEYS = {
  NEW_DOCUMENT: "new-document",
  DOWNLOAD_DOCUMENT: "download-document",
  CREATE_SUB_DOCUMENT: "create-sub-document",
} as const;

export type ShortcutKeyId = (typeof SHORTCUT_KEYS)[keyof typeof SHORTCUT_KEYS];

/** Human-readable label and key combo for the overlay. */
export const SHORTCUT_LABELS: Record<ShortcutKeyId, { label: string; keys: string }> = {
  [SHORTCUT_KEYS.NEW_DOCUMENT]: { label: "New document", keys: "Alt + N" },
  [SHORTCUT_KEYS.DOWNLOAD_DOCUMENT]: { label: "Download document", keys: "Alt + D" },
  [SHORTCUT_KEYS.CREATE_SUB_DOCUMENT]: { label: "Create sub-document", keys: "Alt + S" },
};

/** Single key (without Alt) that triggers the shortcut when overlay is shown or when Alt was pressed. */
export const SHORTCUT_TRIGGER_KEYS: Record<ShortcutKeyId, string> = {
  [SHORTCUT_KEYS.NEW_DOCUMENT]: "n",
  [SHORTCUT_KEYS.DOWNLOAD_DOCUMENT]: "d",
  [SHORTCUT_KEYS.CREATE_SUB_DOCUMENT]: "s",
};
