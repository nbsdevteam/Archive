import apiClient from './client';
import type { UserCapabilityPermissions } from '@/shared/types/capabilityPermissions';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUserDepartment {
  id: number;
  name: string;
  code: string;
  role: string;
}

/** Shared user shape for login, /me, and localStorage. */
export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  emergency_phone?: string;
  role?: 'admin' | 'manager' | 'employee' | string;
  permissions?: UserCapabilityPermissions;
  departments: AuthUserDepartment[];
  department_ids?: number[];
  manager_department_ids?: number[];
  language: string;
  is_admin: boolean;
  is_manager?: boolean;
  uploaded_documents?: number;
  pending_approvals?: number;
  unread_notifications?: number;
}

export interface LoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
  error?: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  error?: string;
}

export interface UserResponse {
  success: boolean;
  user: AuthUser;
  error?: string;
}

export interface ForgotPasswordRequest {
  email: string;
  fe_url?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirm_password?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const authApi = {
  /** Login with username and password. */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/auth/login', {
      username: data.username,
      password: data.password,
    });
    return response.data;
  },

  /** Refresh access token. */
  refresh: async (data: RefreshRequest): Promise<RefreshResponse> => {
    const response = await apiClient.post('/api/auth/refresh', data);
    return response.data;
  },

  /** Logout and clear local tokens. */
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    await apiClient.post('/api/auth/logout', { refresh_token: refreshToken });

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  /** Get current authenticated user (POST /api/auth/me). */
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.post('/api/auth/me', {});
    return response.data;
  },

  /** Request password reset email (public). */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const response = await apiClient.post('/api/auth/forgot-password', data);
    return response.data;
  },

  /** Reset password with token from email link (public). */
  resetPassword: async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const response = await apiClient.post('/api/auth/reset-password', data);
    return response.data;
  },
};
