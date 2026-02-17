import type { TFunction } from "i18next";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
import type { Company } from "@/shared/types/company";

export interface CompanyColumnsOptions {
  t: TFunction;
}

/**
 * Returns DataTable column definitions for the companies list.
 * Columns: name, phone, email, vat, street, city, country_id, country_name, (details/actions).
 */
export function getCompanyTableColumns(
  options: CompanyColumnsOptions
): ColumnDef<Company>[] {
  const { t } = options;
  return [
    {
      id: "name",
      header: t("companies.name", { defaultValue: "Name" }),
      render: (row: Company) => row.name ?? "-",
    },
    {
      id: "phone",
      header: t("companies.phone", { defaultValue: "Phone" }),
      render: (row: Company) => row.phone ?? "-",
    },
    {
      id: "email",
      header: t("companies.email", { defaultValue: "Email" }),
      render: (row: Company) => row.email ?? "-",
    },
    {
      id: "vat",
      header: t("companies.vat", { defaultValue: "VAT" }),
      render: (row: Company) => row.vat ?? "-",
    },
    {
      id: "street",
      header: t("companies.street", { defaultValue: "Street" }),
      render: (row: Company) => row.street ?? "-",
    },
    {
      id: "city",
      header: t("companies.city", { defaultValue: "City" }),
      render: (row: Company) => row.city ?? "-",
    },
    {
      id: "country_id",
      header: t("companies.countryId", { defaultValue: "Country ID" }),
      render: (row: Company) => (row.country_id != null ? String(row.country_id) : "-"),
    },
    {
      id: "country",
      header: t("companies.countryName", { defaultValue: "Country name" }),
      render: (row: Company) => row.country_name ?? "-",
    },
  ];
}
