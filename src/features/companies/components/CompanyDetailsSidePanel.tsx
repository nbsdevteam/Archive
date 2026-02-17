import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SidePanel } from "@/shared/components/ui";
import { getCompany, getCompanyStats } from "../services/companies.api";
import type { CompanyDetail } from "../types/companies.types";
import type { CompanyStats } from "../types/companies.types";

export interface CompanyDetailsSidePanelProps {
  isOpen: boolean;
  companyId: number | null;
  onClose: () => void;
}

export function CompanyDetailsSidePanel({
  isOpen,
  companyId,
  onClose,
}: CompanyDetailsSidePanelProps) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<CompanyDetail | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !companyId) {
      setDetail(null);
      setStats(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getCompany(companyId), getCompanyStats(companyId)])
      .then(([d, s]) => {
        if (!cancelled) {
          setDetail(d);
          setStats(s);
        }
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

  const name = detail?.name ?? "-";
  const totals = stats?.totals;
  const byDepartment = stats?.by_department ?? {};
  const byType = stats?.by_type ?? {};

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={name}
      loading={loading}
      width="50vw"
    >
      {error && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {error}
        </div>
      )}
      {detail && !error && (
        <div className="d-flex flex-column gap-3">
          <section>
            <h6 className="text-muted small text-uppercase mb-2">
              {t("companies.details", { defaultValue: "Details" })}
            </h6>
            <dl className="mb-0 small">
              <dt className="text-muted">{t("companies.name", { defaultValue: "Name" })}</dt>
              <dd className="mb-1">{detail.name ?? "-"}</dd>
              <dt className="text-muted">{t("companies.phone", { defaultValue: "Phone" })}</dt>
              <dd className="mb-1">{detail.phone ?? "-"}</dd>
              <dt className="text-muted">{t("companies.email", { defaultValue: "Email" })}</dt>
              <dd className="mb-1">{detail.email ?? "-"}</dd>
              <dt className="text-muted">{t("companies.vat", { defaultValue: "VAT" })}</dt>
              <dd className="mb-1">{detail.vat ?? "-"}</dd>
              <dt className="text-muted">{t("companies.street", { defaultValue: "Street" })}</dt>
              <dd className="mb-1">{detail.street ?? "-"}</dd>
              <dt className="text-muted">{t("companies.city", { defaultValue: "City" })}</dt>
              <dd className="mb-1">{detail.city ?? "-"}</dd>
              <dt className="text-muted">{t("companies.country", { defaultValue: "Country" })}</dt>
              <dd className="mb-1">{detail.country_name ?? "-"}</dd>
              <dt className="text-muted">{t("companies.website", { defaultValue: "Website" })}</dt>
              <dd className="mb-1">{detail.website ?? "-"}</dd>
              <dt className="text-muted">{t("companies.folderCount", { defaultValue: "Folders" })}</dt>
              <dd className="mb-1">{detail.folder_count ?? 0}</dd>
              <dt className="text-muted">{t("companies.documentCount", { defaultValue: "Documents" })}</dt>
              <dd className="mb-1">{detail.document_count ?? 0}</dd>
            </dl>
          </section>
          {stats && (
            <>
              <section>
                <h6 className="text-muted small text-uppercase mb-2">
                  {t("companies.totals", { defaultValue: "Totals" })}
                </h6>
                <ul className="list-unstyled mb-0 small">
                  <li>{t("companies.folders", { defaultValue: "Folders" })}: {totals?.folders ?? 0}</li>
                  <li>{t("companies.documents", { defaultValue: "Documents" })}: {totals?.documents ?? 0}</li>
                  <li>{t("companies.mainDocuments", { defaultValue: "Main documents" })}: {totals?.main_documents ?? 0}</li>
                  <li>{t("companies.subDocuments", { defaultValue: "Sub documents" })}: {totals?.sub_documents ?? 0}</li>
                </ul>
              </section>
              {Object.keys(byDepartment).length > 0 && (
                <section>
                  <h6 className="text-muted small text-uppercase mb-2">
                    {t("companies.byDepartment", { defaultValue: "By department" })}
                  </h6>
                  <ul className="list-unstyled mb-0 small">
                    {Object.entries(byDepartment).map(([dept, v]) => (
                      <li key={dept}>
                        {dept}: {v.count} ({v.main} main, {v.sub} sub)
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {Object.keys(byType).length > 0 && (
                <section>
                  <h6 className="text-muted small text-uppercase mb-2">
                    {t("companies.byType", { defaultValue: "By type" })}
                  </h6>
                  <ul className="list-unstyled mb-0 small">
                    {Object.entries(byType).map(([typeName, n]) => (
                      <li key={typeName}>
                        {typeName}: {n}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </SidePanel>
  );
}
