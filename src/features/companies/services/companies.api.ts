/**
 * Companies API: list (JSON-RPC), get single + stats (JSON-RPC), create/update/delete (plain HTTP).
 */

import { jsonRpcRequest, httpRequest, httpDelete } from "@/shared/lib/http";
import type { Company } from "@/shared/types/company";
import type {
  CompanyDetail,
  CompanyStats,
  CompanyCreatePayload,
  CompanyUpdatePayload,
} from "../types/companies.types";

/** JSON-RPC list result shape (success, data, count). */
interface CompaniesListResult {
  success: boolean;
  data: Company[];
  count?: number;
}

/**
 * List companies with optional search and limit.
 * POST /api/companies (JSON-RPC).
 */
export async function listCompanies(params?: {
  search?: string;
  limit?: number;
}): Promise<{ data: Company[]; count?: number }> {
  const payload: Record<string, unknown> = {};
  if (params?.search != null) payload.search = params.search;
  if (params?.limit != null) payload.limit = params.limit;
  const result = await jsonRpcRequest<CompaniesListResult>(
    "/api/companies",
    payload
  );
  const raw = result as CompaniesListResult;
  const data = Array.isArray((raw as { data?: Company[] }).data)
    ? (raw as CompaniesListResult).data
    : (raw as unknown as { data: Company[] }).data ?? [];
  const count =
    typeof (raw as CompaniesListResult).count === "number"
      ? (raw as CompaniesListResult).count
      : undefined;
  return { data, count };
}

/**
 * Get single company with optional website and folder/document counts.
 * POST /api/companies/<company_id> (JSON-RPC).
 */
export async function getCompany(companyId: number): Promise<CompanyDetail> {
  const result = await jsonRpcRequest<{ success?: boolean; data?: CompanyDetail } | CompanyDetail>(
    `/api/companies/${companyId}`,
    {}
  );
  const raw = result as { success?: boolean; data?: CompanyDetail };
  if (raw && typeof raw === "object" && "data" in raw && raw.data) {
    return raw.data as CompanyDetail;
  }
  return result as CompanyDetail;
}

/**
 * Get company statistics (totals, by_department, by_type).
 * POST /api/companies/<company_id>/stats (JSON-RPC).
 */
export async function getCompanyStats(companyId: number): Promise<CompanyStats> {
  const result = await jsonRpcRequest<{ success?: boolean; data?: CompanyStats } | CompanyStats>(
    `/api/companies/${companyId}/stats`,
    {}
  );
  const raw = result as { success?: boolean; data?: CompanyStats };
  if (raw && typeof raw === "object" && "data" in raw && raw.data) {
    return raw.data as CompanyStats;
  }
  return result as CompanyStats;
}

/**
 * Create company (managers only). Plain HTTP POST.
 * POST /api/companies/create
 */
export async function createCompany(
  payload: CompanyCreatePayload
): Promise<{ id: number; name: string }> {
  const res = await httpRequest<{ id: number; name: string }>(
    "/api/companies/create",
    payload
  );
  if (!res.success || !res.data) {
    throw new Error(res.error ?? "Create failed");
  }
  return res.data;
}

/**
 * Update company (managers only). Send only fields to update.
 * POST /api/companies/<company_id>/update
 */
export async function updateCompany(
  companyId: number,
  patch: CompanyUpdatePayload
): Promise<{ id: number; name: string }> {
  const res = await httpRequest<{ id: number; name: string }>(
    `/api/companies/${companyId}/update`,
    patch
  );
  if (!res.success || !res.data) {
    throw new Error(res.error ?? "Update failed");
  }
  return res.data;
}

/**
 * Delete company (managers only). Fails if company has folders.
 * DELETE /api/companies/<company_id>
 */
export async function deleteCompany(companyId: number): Promise<{ id: number }> {
  const res = await httpDelete<{ success?: boolean; data?: { id: number }; error?: string; code?: string; folder_count?: number; message_ar?: string }>(
    `/api/companies/${companyId}`
  );
  const body = res as { success?: boolean; data?: { id: number }; error?: string; code?: string; folder_count?: number; message_ar?: string };
  if (body && body.success === false) {
    const err = new Error(body.error ?? "Delete failed") as Error & {
      code?: string;
      folder_count?: number;
      message_ar?: string;
    };
    err.code = body.code;
    err.folder_count = body.folder_count;
    err.message_ar = body.message_ar;
    throw err;
  }
  const data = body && typeof body === "object" && "data" in body ? (body as { data: { id: number } }).data : { id: companyId };
  return data;
}
