import { useState, useMemo } from "react";
import { authApi } from "../../app/adapter/api/auth.api";
import {
  isAuthenticated,
  getAccessToken,
  clearTokens,
  getStoredUser,
  clearStoredUser,
  clearExpiryReminderModalSession,
} from "../utils/storage";
import { useCapabilityPermissionsStore } from "../stores/capabilityPermissionsStore";
import { clearQueryCache } from "../lib/queryClient";
import type { User } from "./types";

/**
 * useAuth - Auth state and user from localStorage; logout via adapter.
 * Lives in shared so the app shell (Header) does not pull the feature-auth chunk on /dashboard.
 * Departments store is cleared on logout via dynamic import to avoid circular deps.
 */
export const useAuth = () => {
  const authenticated = isAuthenticated();
  const user = useMemo<User | null>(() => {
    if (!authenticated) return null;
    return getStoredUser<User>();
  }, [authenticated]);

  const [error, _setError] = useState<string | null>(null);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearStoredUser();
      clearTokens();
      clearExpiryReminderModalSession();
      clearQueryCache();
      useCapabilityPermissionsStore.getState().reset();
      const { useDepartmentsStore } = await import("../stores/departmentsStore");
      useDepartmentsStore.getState().clearDepartments();
    }
  };

  return {
    user,
    authenticated,
    loading: false,
    error,
    logout,
    token: getAccessToken(),
  };
};
