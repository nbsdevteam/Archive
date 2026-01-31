import { useState } from "react";
import { login as loginApi } from "../services/auth.api";
import type { LoginCredentials, LoginResponse } from "../types/auth.types";

/**
 * useLogin - Hook for login functionality
 */
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginApi(credentials);
      if (!response.success) {
        throw new Error(response.error || "Login failed");
      }
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
