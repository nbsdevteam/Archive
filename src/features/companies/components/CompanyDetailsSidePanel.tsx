/**
 * Company details side panel: shows company info and optional stats (folders, documents, by department/type).
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SidePanel } from "@/shared/components/ui";
import { useViewport } from "@/shared/hooks/useViewport";
import { getCompany, getCompanyStats } from "../services/companies.api";
import type { CompanyDetail } from "../services/companies.api";

export interface CompanyDetailsSidePanelProps {
  isOpen: boolean;
  companyId: number | null;
  onClose: () => void;
}

interface StatsData {
  company?: { id: number; name: string };
  totals?: { folders: number; documents: number; main_documents: number; sub_documents: number };
  by_department?: Record<string, { count: number; main: number; sub: number }>;
  by_type?: Record<string, number>;
}

export function CompanyDetailsSidePanel({
  isOpen,
  companyId,
  onClose,
}: CompanyDetailsSidePanelProps) {
  const { t } = useTranslation();
  const { isMobileView } = useViewport();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !companyId) return;
    setError(null);
    setCompany(null);
    setStats(null);
    let cancelled = false;
    setLoading(true);
    Promise.all([getCompany(companyId), getCompanyStats(companyId)])
      .then(([detail, statsResult]) => {
        if (cancelled) return;
        setCompany(detail);
        setStats((statsResult as StatsData) ?? null);
      })
      .catch(() => {
        if (!cancelled) setError(t("errors.loadFailed", { defaultValue: "Failed to load." }));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, companyId, t]);

  if (!companyId) return null;

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t("companies.companyDetails", { defaultValue: "Company details" })}
      loading={loading}
      width={isMobileView ? "100vw" : "50vw"}
    >
      {error && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {error}
        </div>
      )}
      {company && (
        <div className="d-flex flex-column gap-3">
          <dl className="row mb-0">
            <dt className="col-sm-3">{t("companies.name", { defaultValue: "Name" })}</dt>
            <dd className="col-sm-9">{company.name ?? "-"}</dd>
            <dt className="col-sm-3">{t("companies.phone", { defaultValue: "Phone" })}</dt>
            <dd className="col-sm-9">{company.phone ?? "-"}</dd>
            <dt className="col-sm-3">{t("companies.email", { defaultValue: "Email" })}</dt>
            <dd className="col-sm-9">{company.email ?? "-"}</dd>
            <dt className="col-sm-3">{t("companies.country", { defaultValue: "Country" })}</dt>
            <dd className="col-sm-9">{company.country_name ?? "-"}</dd>
            <dt className="col-sm-3">{t("companies.city", { defaultValue: "City" })}</dt>
            <dd className="col-sm-9">{company.city ?? "-"}</dd>
            <dt className="col-sm-3">{t("companies.street", { defaultValue: "Street" })}</dt>
            <dd className="col-sm-9">{company.street ?? "-"}</dd>
            <dt className="col-sm-3">{t("companies.vat", { defaultValue: "VAT" })}</dt>
            <dd className="col-sm-9">{company.vat ?? "-"}</dd>
            <dt className="col-sm-3">{t("companies.website", { defaultValue: "Website" })}</dt>
            <dd className="col-sm-9">{company.website ?? "-"}</dd>
          </dl>
          {stats?.totals && (
            <section>
              <h6 className="mb-2">{t("companies.statistics", { defaultValue: "Statistics" })}</h6>
              <ul className="list-unstyled mb-0">
                <li>{t("companies.folderCount", { defaultValue: "Folders" })}: {stats.totals.folders ?? 0}</li>
                <li>{t("companies.documentCount", { defaultValue: "Documents" })}: {stats.totals.documents ?? 0}</li>
              </ul>
            </section>
          )}
        </div>
      )}
    </SidePanel>
  );
}
