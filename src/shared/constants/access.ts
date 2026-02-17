/**
 * Static access flags until real manager/admin roles are implemented.
 * Module constant avoids state/subscriptions and does not cause rerenders.
 */
export const IS_ADMIN = true as const;

/** Alias for manager-only actions (create/update/delete companies, etc.). */
export const IS_MANAGER = IS_ADMIN;
