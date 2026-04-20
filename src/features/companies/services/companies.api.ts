/**
 * Companies API: list/get/details/stats via JSON-RPC; create/update/batch-delete/delete-all via HTTP POST;
 * single delete via HTTP DELETE. Countries list via JSON-RPC POST /api/countries.
 */

import { jsonRpcRequest, httpClient, httpDelete } from "@/shared/lib/http";
import type { Company } from "@/shared/types/company";

/** Country row from POST /api/countries (jsonrpc) result.data[]. */
export interface ApiCountryRow {
  id?: number;
  name?: string;
  code?: string;
  phone_code?: number;
  [key: string]: unknown;
}

export interface ListCompaniesParams {
  search?: string;
  limit?: number;
}

export interface ListCountriesParams {
  search?: string;
  limit?: number;
}

export interface CompanyDetail extends Company {
  website?: string;
  folder_count?: number;
  document_count?: number;
}

export interface CreateCompanyPayload {
  name: string;
  phone?: string;
  email?: string;
  vat?: string;
  street?: string;
  city?: string;
  country_name?: string;
  website?: string;
}

export interface UpdateCompanyPayload extends CreateCompanyPayload {}

/** Skipped company from batch-delete / delete-all when it has active folders (unless force). */
export interface BatchDeleteSkippedItem {
  id: number;
  reason: string;
  folder_count?: number;
}

export interface BatchDeleteResponse {
  deleted: number[];
  skipped: BatchDeleteSkippedItem[];
  /** Per-item failures; message-only entries are allowed when the API omits id. */
  errors: Array<{ id?: number; message?: string }>;
}

export interface DeleteAllResponse {
  deleted: number[];
  deleted_count: number;
  skipped: BatchDeleteSkippedItem[];
}

/** Unwraps top-level or `{ data: ... }` JSON from company batch/delete-all responses. */
function parseBatchDeletePayload(body: unknown): Record<string, unknown> {
  const root = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const inner = root.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return root;
}

/** Coerces arrays and error rows for `POST /api/companies/batch-delete` results. */
function normalizeBatchDeleteResponse(body: unknown): BatchDeleteResponse {
  const p = parseBatchDeletePayload(body);
  const deleted = Array.isArray(p.deleted) ? (p.deleted as unknown[]).map((x) => Number(x)).filter((n) => !Number.isNaN(n)) : [];
  const skipped = Array.isArray(p.skipped) ? (p.skipped as BatchDeleteSkippedItem[]) : [];
  const rawErrors = Array.isArray(p.errors) ? p.errors : [];
  const errors = rawErrors.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      return {
        id: typeof o.id === "number" ? o.id : Number(o.id),
        message: typeof o.message === "string" ? o.message : String(o.message ?? o.error ?? ""),
      };
    }
    return { message: String(item) };
  });
  return { deleted, skipped, errors };
}

/** Coerces arrays and `deleted_count` for `POST /api/companies/delete-all` results. */
function normalizeDeleteAllResponse(body: unknown): DeleteAllResponse {
  const p = parseBatchDeletePayload(body);
  const deleted = Array.isArray(p.deleted) ? (p.deleted as unknown[]).map((x) => Number(x)).filter((n) => !Number.isNaN(n)) : [];
  const skipped = Array.isArray(p.skipped) ? (p.skipped as BatchDeleteSkippedItem[]) : [];
  const deletedCount =
    typeof p.deleted_count === "number" && !Number.isNaN(p.deleted_count)
      ? p.deleted_count
      : deleted.length;
  return { deleted, deleted_count: deletedCount, skipped };
}

/** JSON-RPC result shape for list endpoints. */
interface JsonRpcListResult<T> {
  success?: boolean;
  data?: T[];
  count?: number;
}

/**
 * List companies (JSON-RPC POST /api/companies).
 */
export async function listCompanies(
  params: ListCompaniesParams = {}
): Promise<{ data: Company[]; count?: number }> {
  const result = await jsonRpcRequest<JsonRpcListResult<Company> | Company[]>(
    "/api/companies",
    { search: params.search ?? undefined, limit: params.limit ?? undefined }
  );
  if (Array.isArray(result)) return { data: result };
  const r = result as JsonRpcListResult<Company>;
  return { data: r?.data ?? [], count: r?.count };
}

/**
 * Get company by id (JSON-RPC POST /api/companies/<id>).
 */
export async function getCompany(id: number): Promise<CompanyDetail> {
  const result = await jsonRpcRequest<{ success?: boolean; data?: CompanyDetail } | CompanyDetail>(
    `/api/companies/${id}`,
    {}
  );
  if (result && typeof result === "object" && "data" in result && (result as { data?: CompanyDetail }).data) {
    return (result as { data: CompanyDetail }).data;
  }
  return result as CompanyDetail;
}

/**
 * Get company statistics (JSON-RPC POST /api/companies/<id>/stats).
 */
export async function getCompanyStats(
  id: number
): Promise<{
  company?: { id: number; name: string };
  totals?: { folders: number; documents: number; main_documents: number; sub_documents: number };
  by_department?: Record<string, { count: number; main: number; sub: number }>;
  by_type?: Record<string, number>;
}> {
  const result = await jsonRpcRequest<{ success?: boolean; data?: unknown }>(
    `/api/companies/${id}/stats`,
    {}
  );
  const r = result as { success?: boolean; data?: unknown };
  return (r?.data as Record<string, unknown>) ?? {};
}

/**
 * Create company (HTTP POST /api/companies/create). Sends country_name and E.164 phone.
 */
export async function createCompany(payload: CreateCompanyPayload): Promise<Company> {
  const res = await httpClient.post<{ success?: boolean; message?: string; data?: Company }>(
    "/api/companies/create",
    payload
  );
  const body = res.data;
  if (!body?.data) throw new Error(body?.message ?? "Failed to create company");
  return body.data;
}

/**
 * Update company (HTTP POST /api/companies/<id>/update). Sends country_name and E.164 phone.
 */
export async function updateCompany(id: number, payload: UpdateCompanyPayload): Promise<Company> {
  const res = await httpClient.post<{ success?: boolean; message?: string; data?: Company }>(
    `/api/companies/${id}/update`,
    payload
  );
  const body = res.data;
  if (!body?.data) throw new Error(body?.message ?? "Failed to update company");
  return body.data;
}

/**
 * Delete company (HTTP DELETE /api/companies/<id>).
 */
export async function deleteCompany(id: number): Promise<void> {
  await httpDelete(`/api/companies/${id}`);
}

/**
 * Batch delete companies (HTTP POST /api/companies/batch-delete).
 * With force false, companies that have active folders are skipped.
 */
export async function batchDeleteCompanies(ids: number[], force = false): Promise<BatchDeleteResponse> {
  const res = await httpClient.post<unknown>("/api/companies/batch-delete", { ids, force });
  return normalizeBatchDeleteResponse(res.data);
}

/**
 * Delete all eligible companies (HTTP POST /api/companies/delete-all).
 * With force false, only companies with no active folders are removed.
 */
export async function deleteAllCompanies(force = false): Promise<DeleteAllResponse> {
  const res = await httpClient.post<unknown>("/api/companies/delete-all", { force });
  return normalizeDeleteAllResponse(res.data);
}

/**
 * List countries (JSON-RPC POST /api/countries). Used for country dropdown; response logged in dev only.
 */
export async function listCountries(params: ListCountriesParams = {}): Promise<{ data: ApiCountryRow[]; count?: number }> {
  const result = await jsonRpcRequest<JsonRpcListResult<ApiCountryRow>>("/api/countries", {
    search: params.search ?? undefined,
    limit: params.limit ?? undefined,
  });
  const r = result as JsonRpcListResult<ApiCountryRow>;
  const data = r?.data ?? [];
  if (import.meta.env.DEV) {
    console.log("[listCountries] /api/countries response:", result);
  }
  return { data, count: r?.count };
}
