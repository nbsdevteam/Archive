import { useState, useCallback } from "react";
import axios from "axios";
import { handleApiError } from "@/app/adapter/api/client";
import { resetPassword } from "../services/auth.api";

/**
 * Submits reset-password with token and new password fields.
 */
export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(
    async (token: string, password: string, confirmPassword: string) => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      if (password !== confirmPassword) {
        const message = "Passwords do not match";
        setError(message);
        setLoading(false);
        throw new Error(message);
      }
      try {
        const res = await resetPassword({
          token,
          password,
          confirm_password: confirmPassword,
        });
        if (!res.success) {
          throw new Error(res.error ?? res.message ?? "Reset failed");
        }
        setSuccess(true);
        return res;
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? handleApiError(err)
          : err instanceof Error
            ? err.message
            : "Reset failed";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { submit, loading, error, success, setError };
}
