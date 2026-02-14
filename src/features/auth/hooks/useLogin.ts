import { useState } from "react";
import { login as loginApi } from "../services/auth.api";
import type { LoginCredentials, LoginResponse } from "../types/auth.types";
import { useDepartmentsStore } from "../../../shared/stores/departmentsStore";

/**
 * useLogin - Hook for login functionality
 * Automatically initializes departments after successful login
 */
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchDepartments } = useDepartmentsStore();

  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginApi(credentials);
      if (!response.success) {
        const err = (response as { error?: string }).error;
        throw new Error(err ?? "Login failed");
      }
      
      // Preload departments after successful login to prevent duplicate calls later
      fetchDepartments().catch((err) => {
        console.warn("Failed to preload departments after login:", err);
      });
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    error,
  };
};
