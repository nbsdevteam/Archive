import { useState, useMemo } from "react";
import { logout as logoutApi } from "../services/auth.api";
import {
  isAuthenticated,
  getAccessToken,
  clearTokens,
  getStoredUser,
  clearStoredUser,
} from "../../../shared/utils/storage";
import type { User } from "../types/auth.types";

/**
 * useAuth - Authentication state and user from localStorage (no /api/auth/me calls).
 * User is set once on login and cleared on logout.
 * Departments store is cleared on logout via dynamic import to avoid circular deps in production chunk.
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
      await logoutApi();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearStoredUser();
      clearTokens();
      // Clear cached departments on logout (dynamic import avoids circular chunk init in prod)
      const { useDepartmentsStore } = await import("../../../shared/stores/departmentsStore");
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
