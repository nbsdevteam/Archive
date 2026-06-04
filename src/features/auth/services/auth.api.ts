/**
 * Auth API service — delegates to adapter and bootstraps session state.
 */

import { authApi as adapterAuthApi } from "../../../app/adapter/api/auth.api";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UserResponse,
} from "../../../app/adapter/api/auth.api";
import { bootstrapAuthSession } from "./sessionBootstrap";

/**
 * Login: stores tokens, bootstraps /me and permissions.
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await adapterAuthApi.login(data);
  if (response.success && response.access_token && response.refresh_token) {
    localStorage.setItem("access_token", response.access_token);
    localStorage.setItem("refresh_token", response.refresh_token);
    if (response.user) {
      localStorage.setItem("user", JSON.stringify(response.user));
    }
    try {
      await bootstrapAuthSession();
    } catch {
      // Keep login response user if bootstrap fails.
    }
  }
  return response;
};

/** Refresh access token in storage. */
export const refreshToken = async (
  data: RefreshRequest,
): Promise<RefreshResponse> => {
  const response = await adapterAuthApi.refresh(data);
  if (response.success && response.access_token) {
    localStorage.setItem("access_token", response.access_token);
  }
  return response;
};

/** Logout via adapter (clears tokens in adapter). */
export const logout = async (): Promise<void> => {
  await adapterAuthApi.logout();
};

/** Get current user from API. */
export const getMe = async (): Promise<UserResponse> => {
  return adapterAuthApi.getCurrentUser();
};

/** Re-hydrate user and permissions after token refresh. */
export const refreshSession = async (): Promise<void> => {
  await bootstrapAuthSession();
};

/**
 * Request password reset link for the given email.
 */
export const forgotPassword = async (
  data: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> => {
  const fe_url =
    data.fe_url ??
    (typeof window !== "undefined"
      ? `${window.location.origin}/reset-password`
      : undefined);
  return adapterAuthApi.forgotPassword({ ...data, fe_url });
};

/**
 * Reset password using token from email link.
 */
export const resetPassword = async (
  data: ResetPasswordRequest,
): Promise<ResetPasswordResponse> => {
  return adapterAuthApi.resetPassword(data);
};
