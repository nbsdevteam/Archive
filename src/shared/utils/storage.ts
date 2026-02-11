/**
 * Token storage utilities
 * Handles storing and retrieving JWT tokens from localStorage
 */

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

/**
 * Get the access token from storage
 */
export const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
};

/**
 * Get the refresh token from storage
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get refresh token:", error);
    return null;
  }
};

/**
 * Set the access token in storage
 */
export const setAccessToken = (token: string): void => {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to set access token:", error);
  }
};

/**
 * Set the refresh token in storage
 */
export const setRefreshToken = (token: string): void => {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to set refresh token:", error);
  }
};

/**
 * Set both tokens at once
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * Clear all tokens from storage
 */
export const clearTokens = (): void => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to clear tokens:", error);
  }
};

/**
 * Get stored user from localStorage (set after login; consumed by useAuth).
 * Returns null if missing or invalid.
 */
export const getStoredUser = <T = unknown>(): T | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

/**
 * Clear stored user from localStorage (called on logout).
 */
export const clearStoredUser = (): void => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("Failed to clear user from storage:", error);
  }
};

/**
 * Check if user is authenticated (has access token)
 */
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};
