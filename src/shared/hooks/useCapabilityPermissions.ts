import { useCapabilityPermissionsStore } from "../stores/capabilityPermissionsStore";

/**
 * Selectors for current-user capability permissions.
 */
export function useCapabilityPermissions() {
  const permissions = useCapabilityPermissionsStore((s) => s.permissions);

  return {
    canDeleteFiles: permissions.can_delete_files,
    canUploadMultiple: permissions.can_upload_multiple,
    uploadLimit: Math.max(1, permissions.upload_limit ?? 1),
  };
}
