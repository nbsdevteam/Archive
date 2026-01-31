import { useState, useEffect } from "react";
import { getMe, logout as logoutApi } from "../services/auth.api";
import { isAuthenticated, getAccessToken, clearTokens } from "../../../shared/utils/storage";
import type { User } from "../types/auth.types";

/**
 * useAuth - Hook for authentication state and user info
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authenticated = isAuthenticated();

  useEffect(() => {
    const fetchUser = async () => {
      if (!authenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getMe();
        if (response.success && response.user) {
          setUser(response.user);
          try {
            localStorage.setItem("user", JSON.stringify(response.user));
          } catch {
            /* ignore storage errors */
          }
        } else {
          // Token might be invalid, clear it
          clearTokens();
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError(err instanceof Error ? err.message : "Failed to load user");
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authenticated]);

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      clearTokens();
    }
  };

  return {
    user,
    authenticated,
    loading,
    error,
    logout,
    token: getAccessToken(),
  };
};
