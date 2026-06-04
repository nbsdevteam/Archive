import { create } from "zustand";
import {
  DEFAULT_CAPABILITY_PERMISSIONS,
  type UserCapabilityPermissions,
} from "../types/capabilityPermissions";

interface CapabilityPermissionsState {
  permissions: UserCapabilityPermissions;
  marqueeDurationSeconds: number;
  setPermissions: (permissions: UserCapabilityPermissions) => void;
  setMarqueeDurationSeconds: (seconds: number) => void;
  reset: () => void;
}

const DEFAULT_MARQUEE_SECONDS = 25;

/**
 * Session-scoped capability permissions and marquee duration for UI gating.
 * Initialized after login via bootstrapAuthSession; cleared on logout.
 */
export const useCapabilityPermissionsStore = create<CapabilityPermissionsState>((set) => ({
  permissions: DEFAULT_CAPABILITY_PERMISSIONS,
  marqueeDurationSeconds: DEFAULT_MARQUEE_SECONDS,
  setPermissions: (permissions) => set({ permissions }),
  setMarqueeDurationSeconds: (seconds) =>
    set({
      marqueeDurationSeconds:
        Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_MARQUEE_SECONDS,
    }),
  reset: () =>
    set({
      permissions: DEFAULT_CAPABILITY_PERMISSIONS,
      marqueeDurationSeconds: DEFAULT_MARQUEE_SECONDS,
    }),
}));
