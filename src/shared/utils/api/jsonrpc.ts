/**
 * JSON-RPC 2.0 utilities
 * Based on API_DOCUMENTATION.md - many endpoints use JSON-RPC format
 */

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params: Record<string, unknown>;
  id: number | string;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: number | string;
}

/**
 * Create a JSON-RPC 2.0 request envelope
 * @param method - The method name (typically "call" for this API)
 * @param params - The parameters object
 * @param id - Request ID (defaults to 1)
 */
export const createJsonRpcRequest = (
  method: string = "call",
  params: Record<string, unknown> = {},
  id: number | string = 1
): JsonRpcRequest => {
  return {
    jsonrpc: "2.0",
    method,
    params,
    id,
  };
};

/**
 * Extract the result from a JSON-RPC response
 * Throws if the response contains an error
 */
export const extractJsonRpcResult = <T = unknown>(
  response: JsonRpcResponse<T>
): T => {
  if (response.error) {
    throw new Error(
      `JSON-RPC Error: ${response.error.message} (code: ${response.error.code})`
    );
  }
  if (response.result === undefined) {
    throw new Error("JSON-RPC Response missing result");
  }
  return response.result;
};
