/**
 * Company (brand) types for POST /api/companies and folder/document filtering.
 */

export interface Company {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  vat?: string;
  street?: string;
  city?: string;
  country_id?: number;
  country_name?: string;
}

/** Response shape for POST /api/companies (search, limit). */
export interface CompaniesResponse {
  success: boolean;
  data: Company[];
  count?: number;
}
