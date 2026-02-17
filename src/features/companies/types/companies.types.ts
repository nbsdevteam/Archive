/**
 * Company feature types: list item, detail (with stats fields), stats payload, and CRUD payloads.
 */

import type { Company } from "@/shared/types/company";

/** Single-company response with optional website and folder/document counts. */
export interface CompanyDetail extends Company {
  website?: string;
  folder_count?: number;
  document_count?: number;
}

/** Stats response: company summary, totals, by_department, by_type. */
export interface CompanyStats {
  company: { id: number; name: string };
  totals: {
    folders: number;
    documents: number;
    main_documents: number;
    sub_documents: number;
  };
  by_department: Record<
    string,
    { count: number; main: number; sub: number }
  >;
  by_type: Record<string, number>;
}

/** Create company request body (name required; rest optional). country_id = calling code number. */
export interface CompanyCreatePayload {
  name: string;
  phone?: string;
  email?: string;
  vat?: string;
  street?: string;
  city?: string;
  country_id?: number;
  country_name?: string;
  website?: string;
}

/** Update company request body (patch: only fields to update). country_id = calling code number. */
export interface CompanyUpdatePayload {
  name?: string;
  phone?: string;
  email?: string;
  vat?: string;
  street?: string;
  city?: string;
  country_id?: number;
  country_name?: string;
  website?: string;
}

/** Delete error when company has folders (API returns code + folder_count + message_ar). */
export interface CompanyDeleteErrorBody {
  success: false;
  error: string;
  code?: "COMPANY_HAS_FOLDERS";
  folder_count?: number;
  message_ar?: string;
}
