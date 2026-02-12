import { useState, useMemo } from "react";
import { logout as logoutApi } from "../services/auth.api";
import {
  isAuthenticated,
  getAccessToken,
  clearTokens,
  getStoredUser,
  clearStoredUser,
} from "../../../shared/utils/storage";
import { useDepartmentsStore } from "../../../shared/stores/departmentsStore";
import type { User } from "../types/auth.types";

/**
 * useAuth - Authentication state and user from localStorage (no /api/auth/me calls).
 * User is set once on login and cleared on logout.
 */
export const useAuth = () => {
  const authenticated = isAuthenticated();
  const user = useMemo<User | null>(() => {
    if (!authenticated) return null;
    return getStoredUser<User>();
  }, [authenticated]);

  const [error, setError] = useState<string | null>(null);
  const { clearDepartments } = useDepartmentsStore();

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearStoredUser();
      clearTokens();
      // Clear cached departments on logout
      clearDepartments();
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
