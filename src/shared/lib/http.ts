import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { getAccessToken } from "../utils/storage";
import type { JsonRpcRequest, JsonRpcResponse } from "../utils/api/jsonrpc";

/**
 * Get the API base URL from environment variable
 * Use empty string to use Vite proxy in development
 */
const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || "";
};

/**
 * Common API response shape (from API_DOCUMENTATION.md)
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  stats?: unknown;
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Create an axios instance configured for the archive API
 */
export const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
    // Important for Odoo session cookies when applicable
    withCredentials: true,
  });

  // Add JWT token to requests if available
  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle common response shapes
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error) => {
      // Handle 401 unauthorized - token might be expired
      if (error.response?.status === 401) {
        // Could trigger token refresh here in the future
        console.warn("Unauthorized request - token may be expired");
      }
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Default HTTP client instance
 */
export const httpClient = createHttpClient();

/**
 * Make a JSON-RPC request
 * @param endpoint - API endpoint (e.g., "/api/documents")
 * @param params - Parameters to send in the JSON-RPC envelope
 * @param config - Additional axios config
 */
export const jsonRpcRequest = async <T = unknown>(
  endpoint: string,
  params: Record<string, unknown> = {},
  config?: AxiosRequestConfig
): Promise<T> => {
  const { createJsonRpcRequest, extractJsonRpcResult } = await import(
    "../utils/api/jsonrpc"
  );

  const request: JsonRpcRequest = createJsonRpcRequest("call", params);

  const response = await httpClient.post<JsonRpcResponse<T>>(
    endpoint,
    request,
    config
  );

  return extractJsonRpcResult(response.data);
};

/**
 * Make a regular HTTP request (non-JSON-RPC)
 * @param endpoint - API endpoint
 * @param data - Request body
 * @param config - Additional axios config
 */
export const httpRequest = async <T = unknown>(
  endpoint: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await httpClient.post<ApiResponse<T>>(endpoint, data, config);
  return response.data;
};

/**
 * Make a GET request
 * @param endpoint - API endpoint
 * @param config - Additional axios config
 */
export const httpGet = async <T = unknown>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await httpClient.get<T>(endpoint, config);
  return response.data;
};

/**
 * Make a DELETE request
 * @param endpoint - API endpoint
 * @param config - Additional axios config
 */
export const httpDelete = async <T = unknown>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await httpClient.delete<T>(endpoint, config);
  return response.data;
};
