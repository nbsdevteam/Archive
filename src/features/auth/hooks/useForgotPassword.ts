import { useState, useCallback } from "react";
import axios from "axios";
import { handleApiError } from "@/app/adapter/api/client";
import { forgotPassword } from "../services/auth.api";

/**
 * Submits forgot-password request and surfaces loading/error state.
 */
export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await forgotPassword({ email: email.trim() });
      if (!res.success) {
        throw new Error(res.error ?? res.message ?? "Request failed");
      }
      setSuccess(true);
      return res;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? handleApiError(err)
        : err instanceof Error
          ? err.message
          : "Request failed";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error, success, setError };
}
