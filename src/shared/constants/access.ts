import type { User } from "../auth/types";
import { getStoredUser } from "../utils/storage";

/**
 * Returns true when the user has administrator access (role or legacy is_admin flag).
 */
export function getIsAdmin(user?: User | null): boolean {
  const resolved = user ?? getStoredUser<User>();
  if (!resolved) return false;
  return resolved.role === "admin" || resolved.is_admin === true;
}

/**
 * Returns true when the user has manager access (includes admins).
 */
export function getIsManager(user?: User | null): boolean {
  const resolved = user ?? getStoredUser<User>();
  if (!resolved) return false;
  return (
    getIsAdmin(resolved) ||
    resolved.role === "manager" ||
    resolved.is_manager === true
  );
}

/** @deprecated Use getIsAdmin(user) or useAuth + getIsAdmin instead. */
export const IS_ADMIN = false as const;

/** @deprecated Use getIsManager(user) instead. */
export const IS_MANAGER = false as const;
