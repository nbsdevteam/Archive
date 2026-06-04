/**
 * Permissions API — admin user CRUD, per-user capabilities, and current-user permissions.
 */

import { httpGet, httpRequest, type ApiResponse } from "@/shared/lib/http";
import type { UserCapabilityPermissions } from "@/shared/types/capabilityPermissions";
import type {
  AdminResetPasswordPayload,
  AdminUser,
  AdminUserDetails,
  AdminUserListFilters,
  CreateAdminUserPayload,
  EditAdminUserPayload,
} from "../types/permissions.types";

const ADMIN_USERS = "/api/nbs/admin/users";
const ME_PERMISSIONS = "/api/nbs/users/me/permissions";

function unwrapApiData<T>(res: ApiResponse<T>): T {
  if (res.success === false && res.error) {
    throw new Error(res.error);
  }
  const data = res.data;
  if (data && typeof data === "object" && "data" in (data as Record<string, unknown>)) {
    return (data as unknown as { data: T }).data;
  }
  return data as T;
}

function unwrapList<T>(res: ApiResponse<T[] | unknown>): T[] {
  const data = unwrapApiData<T[] | unknown>(res);
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { users: T[] }).users)) {
    return (data as { users: T[] }).users;
  }
  return [];
}

/**
 * GET /api/nbs/users/me/permissions
 */
export async function getMyPermissions(): Promise<UserCapabilityPermissions> {
  const res = await httpGet<ApiResponse<UserCapabilityPermissions>>(ME_PERMISSIONS);
  if (res && typeof res === "object" && "success" in res) {
    return unwrapApiData(res as ApiResponse<UserCapabilityPermissions>);
  }
  return res as UserCapabilityPermissions;
}

/**
 * POST /api/nbs/admin/users/create
 */
export async function createAdminUser(
  payload: CreateAdminUserPayload,
): Promise<AdminUser> {
  const res = await httpRequest<AdminUser>(`${ADMIN_USERS}/create`, payload);
  return unwrapApiData(res);
}

/**
 * GET /api/nbs/admin/users/list with optional query filters.
 */
export async function listAdminUsers(
  filters?: AdminUserListFilters,
): Promise<AdminUser[]> {
  const params: Record<string, string | number> = {};
  if (filters?.search) params.search = filters.search;
  if (filters?.role) params.role = filters.role;
  if (filters?.page) params.page = filters.page;
  if (filters?.per_page) params.per_page = filters.per_page;

  const res = await httpGet<ApiResponse<AdminUser[]>>(
    `${ADMIN_USERS}/list`,
    { params },
  );
  if (res && typeof res === "object" && "success" in res) {
    return unwrapList<AdminUser>(res as ApiResponse<AdminUser[]>);
  }
  return Array.isArray(res) ? res : [];
}

/**
 * POST /api/nbs/admin/users/list — server-side filter body.
 */
export async function listAdminUsersPost(
  filters: AdminUserListFilters,
): Promise<AdminUser[]> {
  const res = await httpRequest<AdminUser[]>(`${ADMIN_USERS}/list`, filters);
  return unwrapList<AdminUser>(res);
}

/**
 * GET /api/nbs/admin/users/{id}/details
 */
export async function getAdminUserDetails(userId: number): Promise<AdminUserDetails> {
  const res = await httpGet<ApiResponse<AdminUserDetails>>(
    `${ADMIN_USERS}/${userId}/details`,
  );
  if (res && typeof res === "object" && "success" in res) {
    return unwrapApiData(res as ApiResponse<AdminUserDetails>);
  }
  return res as AdminUserDetails;
}

/**
 * POST /api/nbs/admin/users/{id}/edit
 */
export async function editAdminUser(
  userId: number,
  payload: EditAdminUserPayload,
): Promise<AdminUserDetails> {
  const res = await httpRequest<AdminUserDetails>(
    `${ADMIN_USERS}/${userId}/edit`,
    payload,
  );
  return unwrapApiData(res);
}

/**
 * POST /api/nbs/admin/users/{id}/delete (deactivate)
 */
export async function deleteAdminUser(userId: number): Promise<{ success: boolean }> {
  const res = await httpRequest<{ success: boolean }>(
    `${ADMIN_USERS}/${userId}/delete`,
    {},
  );
  return { success: res.success ?? true };
}

/**
 * POST /api/nbs/admin/users/{id}/reset-password
 */
export async function resetAdminUserPassword(
  userId: number,
  payload: AdminResetPasswordPayload,
): Promise<{ success: boolean }> {
  const res = await httpRequest<{ success: boolean }>(
    `${ADMIN_USERS}/${userId}/reset-password`,
    payload,
  );
  return { success: res.success ?? true };
}

/**
 * GET /api/nbs/admin/users/{id}/permissions
 */
export async function getAdminUserPermissions(
  userId: number,
): Promise<UserCapabilityPermissions> {
  const res = await httpGet<ApiResponse<UserCapabilityPermissions>>(
    `${ADMIN_USERS}/${userId}/permissions`,
  );
  if (res && typeof res === "object" && "success" in res) {
    return unwrapApiData(res as ApiResponse<UserCapabilityPermissions>);
  }
  return res as UserCapabilityPermissions;
}

/**
 * POST /api/nbs/admin/users/{id}/permissions
 */
export async function setAdminUserPermissions(
  userId: number,
  permissions: UserCapabilityPermissions,
): Promise<UserCapabilityPermissions> {
  const res = await httpRequest<UserCapabilityPermissions>(
    `${ADMIN_USERS}/${userId}/permissions`,
    permissions,
  );
  return unwrapApiData(res);
}
