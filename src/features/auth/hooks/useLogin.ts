import { useState } from "react";
import axios from "axios";
import { handleApiError } from "../../../app/adapter/api/client";
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
      // Prefer API error body (e.g. "Invalid credentials") over axios message ("Request failed with status code 401")
      const errorMessage = axios.isAxiosError(err) ? handleApiError(err) : (err instanceof Error ? err.message : "Login failed");
      setError(errorMessage);
      throw new Error(errorMessage);
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
