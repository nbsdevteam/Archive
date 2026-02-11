/**
 * Auth API service
 * Delegates to adapter API layer
 */

import { authApi as adapterAuthApi } from "../../../app/adapter/api/auth.api";
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  UserResponse,
} from "../../../app/adapter/api/auth.api";

/**
 * Login: stores tokens, then fetches /api/auth/me once and stores full user in localStorage.
 * All consumers (e.g. useAuth) read user from localStorage; no further /auth/me calls.
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await adapterAuthApi.login(data);
  if (response.success && response.access_token && response.refresh_token) {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    if (response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    // Fetch full user (e.g. uploaded_documents, pending_approvals) once and persist for the session
    try {
      const meResponse = await adapterAuthApi.getCurrentUser();
      if (meResponse?.success && meResponse?.user) {
        localStorage.setItem('user', JSON.stringify(meResponse.user));
      }
    } catch {
      // Keep login response user if /me fails
    }
  }
  return response;
};

/**
 * Refresh access token
 */
export const refreshToken = async (data: RefreshRequest): Promise<RefreshResponse> => {
  const response = await adapterAuthApi.refresh(data);
  if (response.success && response.access_token) {
    localStorage.setItem('access_token', response.access_token);
  }
  return response;
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  await adapterAuthApi.logout();
};

/**
 * Get current user
 */
export const getMe = async (): Promise<UserResponse> => {
  return await adapterAuthApi.getCurrentUser();
};
