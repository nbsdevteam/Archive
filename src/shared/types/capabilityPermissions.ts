/**
 * Per-user capability flags from GET /api/nbs/users/me/permissions
 * and admin GET/POST /api/nbs/admin/users/{id}/permissions.
 */
export interface UserCapabilityPermissions {
  can_delete_files: boolean;
  can_upload_multiple: boolean;
  upload_limit: number;
}

export const DEFAULT_CAPABILITY_PERMISSIONS: UserCapabilityPermissions = {
  can_delete_files: false,
  can_upload_multiple: false,
  upload_limit: 1,
};
