import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { forceLogout } from '../../../shared/utils/storage';

// API Base URL - use relative path for proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Odoo session cookies
});

/**
 * Returns true when the URL belongs to an auth endpoint (login / refresh)
 * so we never accidentally force-logout during those flows.
 */
const isAuthEndpoint = (url?: string): boolean =>
  Boolean(url?.includes('/api/auth/login') || url?.includes('/api/auth/refresh'));

/**
 * Checks whether an API response body signals "Unauthorized" even though
 * the HTTP status was 200.  The backend may return:
 *   { result: { success: false, error: "Unauthorized", data: [] } }
 */
const isBodyUnauthorized = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false;
  const root = data as Record<string, unknown>;

  // Check top-level: { success: false, error: "Unauthorized" }
  if (root.success === false && typeof root.error === 'string' && root.error.toLowerCase() === 'unauthorized') {
    return true;
  }

  // Check nested: { result: { success: false, error: "Unauthorized" } }
  const result = root.result;
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    if (r.success === false && typeof r.error === 'string' && r.error.toLowerCase() === 'unauthorized') {
      return true;
    }
  }

  return false;
};

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors, body-level Unauthorized, and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Detect body-level "Unauthorized" on otherwise successful HTTP responses
    if (!isAuthEndpoint(response.config.url) && isBodyUnauthorized(response.data)) {
      forceLogout();
      return Promise.reject(new Error('Session expired. Redirecting to login.'));
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Don't try to refresh token for login/refresh endpoints
    if (isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }

    // Also check body-level Unauthorized on error responses (e.g. 400 with Unauthorized body)
    if (error.response && isBodyUnauthorized(error.response.data)) {
      forceLogout();
      return Promise.reject(new Error('Session expired. Redirecting to login.'));
    }
    
    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const refreshUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/refresh` : '/api/auth/refresh';
          const response = await axios.post(refreshUrl, {
            refresh_token: refreshToken,
          }, {
            withCredentials: true,
          });
          
          const { access_token } = response.data;
          
          // Save new token
          localStorage.setItem('access_token', access_token);
          
          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          forceLogout();
          return Promise.reject(refreshError);
        }
      } else {
        forceLogout();
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      return error.response.data?.error || error.response.data?.message || 'An error occurred';
    } else if (error.request) {
      // Request made but no response
      return 'No response from server. Please check your connection.';
    }
  }
  return 'An unexpected error occurred';
};

export default apiClient;
