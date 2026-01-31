/**
 * Auth feature types
 * Based on API_DOCUMENTATION.md
 */

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponseUser {
  id: number;
  name: string;
  username: string;
  email: string;
  departments: Array<{ id: number; name: string; code: string; role: string }>;
  language: string;
  is_admin: boolean;
  is_manager?: boolean;
}

export interface LoginResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  user?: LoginResponseUser;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  name?: string;
  role?: string;
  department_ids?: number[];
  manager_department_ids?: number[];
  is_admin?: boolean;
  is_manager?: boolean;
  departments?: Array<{ id: number; name: string; code: string; role: string }>;
  language?: string;
}

export interface MeResponse {
  success: boolean;
  data?: User;
  error?: string;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}
