/**
 * Permissions API - Admin users list and update
 * Based on API_DOCUMENTATION.md (Permissions admin, type=http)
 */

import { httpRequest } from "../../../shared/lib/http";
import type { AdminUser, PermissionUpdateParams } from "../types/permissions.types";

const ADMIN_USERS_ENDPOINT = "/api/nbs/admin/users";

/**
 * List admin users with optional search.
 * POST /api/nbs/admin/users with body { search?: string }
 */
export async function listAdminUsers(search?: string): Promise<AdminUser[]> {
  const res = await httpRequest<AdminUser[] | unknown>(ADMIN_USERS_ENDPOINT, {
    search: search ?? "",
  });
  if (!res.success && res.error) {
    throw new Error(res.error);
  }
  const data = res.data;
  if (Array.isArray(data)) {
    return data as AdminUser[];
  }
  if (data && typeof data === "object" && "data" in (data as Record<string, unknown>)) {
    const inner = (data as { data: unknown }).data;
    return Array.isArray(inner) ? (inner as AdminUser[]) : [];
  }
  return [];
}

/**
 * Update a user's role and department access.
 * POST /api/nbs/admin/users/<user_id>/update
 */
export async function updateAdminUser(
  userId: number,
  payload: PermissionUpdateParams
): Promise<{ success: boolean }> {
  const res = await httpRequest<{ success: boolean }>(
    `${ADMIN_USERS_ENDPOINT}/${userId}/update`,
    payload
  );
  if (!res.success && res.error) {
    throw new Error(res.error);
  }
  return { success: res.success ?? true };
}
