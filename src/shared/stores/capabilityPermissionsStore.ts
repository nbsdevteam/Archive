import { create } from "zustand";
import {
  DEFAULT_CAPABILITY_PERMISSIONS,
  type UserCapabilityPermissions,
} from "../types/capabilityPermissions";

interface CapabilityPermissionsState {
  permissions: UserCapabilityPermissions;
  setPermissions: (permissions: UserCapabilityPermissions) => void;
  reset: () => void;
}

/**
 * Session-scoped capability permissions for UI gating.
 * Initialized after login via bootstrapAuthSession; cleared on logout.
 */
export const useCapabilityPermissionsStore = create<CapabilityPermissionsState>((set) => ({
  permissions: DEFAULT_CAPABILITY_PERMISSIONS,
  setPermissions: (permissions) => set({ permissions }),
  reset: () =>
    set({
      permissions: DEFAULT_CAPABILITY_PERMISSIONS,
    }),
}));
