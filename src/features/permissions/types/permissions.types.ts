/**
 * Permissions feature types — admin user management and capability flags.
 */

import type { UserCapabilityPermissions } from "@/shared/types/capabilityPermissions";

export type AdminUserRole = "admin" | "manager" | "employee";

export interface AdminUser {
  id: number;
  username: string;
  email?: string;
  name?: string;
  phone?: string;
  emergency_phone?: string;
  role: AdminUserRole;
  department_ids: number[];
  manager_department_ids: number[];
  is_admin?: boolean;
  active?: boolean;
}

export interface AdminUserDetails extends AdminUser {
  permissions?: UserCapabilityPermissions;
  created_at?: string;
  last_login?: string;
}

export interface AdminUserListFilters {
  search?: string;
  role?: AdminUserRole | "";
  page?: number;
  per_page?: number;
}

export interface CreateAdminUserPayload {
  username: string;
  email: string;
  password: string;
  name?: string;
  phone?: string;
  emergency_phone?: string;
  role: AdminUserRole;
  department_ids?: number[];
  manager_department_ids?: number[];
}

export interface EditAdminUserPayload {
  username?: string;
  email?: string;
  name?: string;
  phone?: string;
  emergency_phone?: string;
  role?: AdminUserRole;
  department_ids?: number[];
  manager_department_ids?: number[];
  active?: boolean;
}

export interface AdminResetPasswordPayload {
  password: string;
  confirm_password?: string;
}

export interface PermissionUpdateParams {
  role: AdminUserRole;
  department_ids: number[];
  manager_department_ids: number[];
}

export type { UserCapabilityPermissions };
