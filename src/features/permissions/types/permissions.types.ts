/**
 * Permissions feature types
 * Based on API_DOCUMENTATION.md
 */

export interface AdminUser {
  id: number;
  username: string;
  email?: string;
  name?: string;
  role: "admin" | "manager" | "employee";
  department_ids: number[];
  manager_department_ids: number[];
  is_admin?: boolean;
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface PermissionUpdateParams {
  role: "admin" | "manager" | "employee";
  department_ids: number[];
  manager_department_ids: number[];
}
