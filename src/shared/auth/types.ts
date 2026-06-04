/**
 * Minimal user type for useAuth (shell and app).
 * Matches shape stored in localStorage after login; full types live in features/auth.
 */
import type { UserCapabilityPermissions } from "../types/capabilityPermissions";

export interface User {
  id: number;
  username: string;
  email?: string;
  name?: string;
  phone?: string;
  emergency_phone?: string;
  role?: string;
  permissions?: UserCapabilityPermissions;
  department_ids?: number[];
  manager_department_ids?: number[];
  is_admin?: boolean;
  is_manager?: boolean;
  departments?: Array<{ id: number; name: string; code: string; role: string }>;
  language?: string;
  uploaded_documents?: number;
  pending_approvals?: number;
  unread_notifications?: number;
}
