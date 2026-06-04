import { authApi as adapterAuthApi } from "@/app/adapter/api/auth.api";
import { getMyPermissions } from "@/features/permissions/services/permissions.api";
import { getMarqueeSettings } from "@/features/settings/services/settings.api";
import { useCapabilityPermissionsStore } from "@/shared/stores/capabilityPermissionsStore";
import {
  DEFAULT_CAPABILITY_PERMISSIONS,
  type UserCapabilityPermissions,
} from "@/shared/types/capabilityPermissions";
import type { User } from "@/shared/auth/types";

/**
 * Normalizes permissions from /me user payload or dedicated permissions endpoint.
 */
export function normalizeCapabilityPermissions(
  source?: Partial<UserCapabilityPermissions> | null,
): UserCapabilityPermissions {
  if (!source) return DEFAULT_CAPABILITY_PERMISSIONS;
  return {
    can_delete_files: Boolean(source.can_delete_files),
    can_upload_multiple: Boolean(source.can_upload_multiple),
    upload_limit:
      typeof source.upload_limit === "number" && source.upload_limit > 0
        ? source.upload_limit
        : DEFAULT_CAPABILITY_PERMISSIONS.upload_limit,
  };
}

/**
 * Fetches /api/auth/me, persists user, loads capability permissions and marquee duration.
 */
export async function bootstrapAuthSession(): Promise<User | null> {
  const meResponse = await adapterAuthApi.getCurrentUser();
  if (!meResponse?.success || !meResponse.user) return null;

  const user = meResponse.user as User;
  localStorage.setItem("user", JSON.stringify(user));

  const store = useCapabilityPermissionsStore.getState();
  const fromMe = (user as User & { permissions?: Partial<UserCapabilityPermissions> })
    .permissions;

  try {
    const remote = await getMyPermissions();
    store.setPermissions(normalizeCapabilityPermissions(remote ?? fromMe));
  } catch {
    store.setPermissions(normalizeCapabilityPermissions(fromMe));
  }

  try {
    const marquee = await getMarqueeSettings();
    if (marquee?.marquee_duration != null) {
      store.setMarqueeDurationSeconds(marquee.marquee_duration);
    }
  } catch {
    // Non-admins may not read admin settings; keep default duration.
  }

  return user;
}
