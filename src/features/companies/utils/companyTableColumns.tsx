import type { TFunction } from "i18next";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
import type { Company } from "@/shared/types/company";

export interface CompanyTableColumnsOptions {
  t: TFunction;
}

/**
 * Returns DataTable column definitions for the companies list (name, phone, email, country, city).
 */
export function getCompanyTableColumns(options: CompanyTableColumnsOptions): ColumnDef<Company>[] {
  const { t } = options;
  return [
    {
      id: "name",
      truncate: true,
      header: t("companies.name", { defaultValue: "Name" }),
      render: (row: Company) => row.name ?? "-",
    },
    {
      id: "phone",
      truncate: true,
      header: t("companies.phone", { defaultValue: "Phone" }),
      render: (row: Company) => row.phone ?? "-",
    },
    {
      id: "email",
      truncate: true,
      header: t("companies.email", { defaultValue: "Email" }),
      render: (row: Company) => row.email ?? "-",
    },
    {
      id: "country",
      truncate: true,
      header: t("companies.country", { defaultValue: "Country" }),
      render: (row: Company) => row.country_name ?? "-",
    },
    {
      id: "city",
      truncate: true,
      header: t("companies.city", { defaultValue: "City" }),
      render: (row: Company) => row.city ?? "-",
    },
  ];
}
