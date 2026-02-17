import type { TFunction } from "i18next";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
import type { Company } from "@/shared/types/company";

export interface CompanyColumnsOptions {
  t: TFunction;
}

/**
 * Returns DataTable column definitions for the companies list.
 * Columns: name, phone, email, vat, city, country.
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
      id: "city",
      header: t("companies.city", { defaultValue: "City" }),
      render: (row: Company) => row.city ?? "-",
    },
    {
      id: "country",
      header: t("companies.country", { defaultValue: "Country" }),
      render: (row: Company) => row.country_name ?? "-",
    },
  ];
}
