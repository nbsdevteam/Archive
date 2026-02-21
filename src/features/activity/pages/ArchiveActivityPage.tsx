import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Button } from "../../../shared/components/ui";
import { PaginationSection } from "../../../shared/components/PaginationSection";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { usePaginationFromUrl } from "../../../shared/hooks";
import { useAuditLogs } from "../hooks/useAuditLogs";
import type { ActivityViewMode } from "../types/auditLogs.types";
import { ActivityViewSwitcher, AuditLogsTimeline, AuditLogsTreeView } from "../../../shared/components/Activity";
import { formatDateForAuditApi } from "../utils/activity.utils";
import "../styles/activity.css";

/** Returns date `days` ago as YYYY-MM-DDTHH:mm:ss (start of day) for audit-logs API. */
const getDateDaysAgoFormatted = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateForAuditApi(date, false);
};

const ArchiveActivityPage = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const { page: urlPage, perPage: urlPerPage, setPage, setPerPage, resetPage } = usePaginationFromUrl(50);
  const [viewMode, setViewMode] = useState<ActivityViewMode>("timeline");
  const [treeGroupBy, setTreeGroupBy] = useState<"document" | "action">("document");
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [actionInput, setActionInput] = useState("");
  const defaultDateFrom = useMemo(() => getDateDaysAgoFormatted(7), []);

  const {
    logs,
    loading,
    error,
    pagination,
    params,
    setParams,
    fetchLogs,
  } = useAuditLogs({
    initialParams: {
      date_from: defaultDateFrom,
      page: urlPage,
      per_page: urlPerPage,
    },
  });

  /** Applies filters; sends date_from/date_to as YYYY-MM-DDTHH:mm:ss per audit-logs API. Resets URL to page 1. */
  const applyFilters = useCallback(
    async (nextPage = 1) => {
      const nextParams = {
        ...params,
        page: nextPage,
        per_page: urlPerPage,
        date_from: dateFromInput ? formatDateForAuditApi(dateFromInput, false) : params.date_from,
        date_to: dateToInput ? formatDateForAuditApi(dateToInput, true) : undefined,
        action: actionInput || undefined,
      };
      setParams(nextParams);
      await fetchLogs(nextParams);
    },
    [params, dateFromInput, dateToInput, actionInput, urlPerPage, setParams, fetchLogs]
  );

  const actionOptions = useMemo(() => {
    return [
      "upload",
      "view",
      "download",
      "new_version_uploaded",
      "archive",
      "unarchive",
      "folder_created",
      "folder_updated",
      "folder_moved",
      "folder_deleted",
    ];
  }, []);

  const handleLast7DaysClick = () => {
    const defaultParams = { date_from: getDateDaysAgoFormatted(7), page: 1, per_page: 50 };
    setDateFromInput("");
    setDateToInput("");
    setActionInput("");
    setParams(defaultParams);
    fetchLogs(defaultParams).catch(() => undefined);
  };
  const handleLast24HoursClick = () => {
    const defaultParams = { date_from: getDateDaysAgoFormatted(1), page: 1, per_page: 50 };
    setDateFromInput("");
    setDateToInput("");
    setActionInput("");
    setParams(defaultParams);
    fetchLogs(defaultParams).catch(() => undefined);
  };
  const handleFiltersSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetPage();
    applyFilters(1).catch(() => undefined);
  };
  const handleDateFromChange = (event: React.ChangeEvent<HTMLInputElement>) => setDateFromInput(event.target.value);
  const handleDateToChange = (event: React.ChangeEvent<HTMLInputElement>) => setDateToInput(event.target.value);
  const handleActionInputChange = (event: React.ChangeEvent<HTMLSelectElement>) => setActionInput(event.target.value);
  const handleTreeGroupByChange = (event: React.ChangeEvent<HTMLSelectElement>) => setTreeGroupBy(event.target.value as "document" | "action");

  const handlePageChange = useCallback(
    (p: number) => {
      setPage(p);
      applyFilters(p).catch(() => undefined);
    },
    [setPage, applyFilters]
  );
  const handlePerPageChange = useCallback(
    (pp: number) => {
      setPerPage(pp);
      applyFilters(1).catch(() => undefined);
    },
    [setPerPage, applyFilters]
  );

  const pageTitle = t("activity.title", { defaultValue: "Activity" });

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[{ label: t("documents.title", { defaultValue: "Documents" }), to: routes.documents }]}
      homeTo={routes.adminDashboard}
      rightContent={
        <>
          <Button
            variant="outline"
            size="sm"
            className="btn-outline-secondary"
            onClick={handleLast7DaysClick}
          >
            {t("activity.last7Days", { defaultValue: "Last 7 days" })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="btn-outline-secondary"
            onClick={handleLast24HoursClick}
          >
            {t("activity.last24Hours", { defaultValue: "Last 24h" })}
          </Button>
          <CollapseHeader />
        </>
      }
    >
        <div className="card mb-3">
          <div className="card-body">
            <form
              className="row g-2 align-items-end"
              onSubmit={handleFiltersSubmit}
            >
              <div className="col-md-3">
                <label className="form-label" htmlFor="activity-date-from">{t("activity.filters.dateFrom", { defaultValue: "Date from" })}</label>
                <input
                  id="activity-date-from"
                  type="date"
                  className="form-control"
                  value={dateFromInput}
                  onChange={handleDateFromChange}
                  aria-label={t("activity.filters.dateFrom", { defaultValue: "Date from" })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="activity-date-to">{t("activity.filters.dateTo", { defaultValue: "Date to" })}</label>
                <input
                  id="activity-date-to"
                  type="date"
                  className="form-control"
                  value={dateToInput}
                  onChange={handleDateToChange}
                  aria-label={t("activity.filters.dateTo", { defaultValue: "Date to" })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="activity-filter-action">{t("activity.filters.action", { defaultValue: "Action" })}</label>
                <select
                  id="activity-filter-action"
                  className="form-select"
                  value={actionInput}
                  onChange={handleActionInputChange}
                  aria-label={t("activity.filters.action", { defaultValue: "Action" })}
                >
                  <option value="">{t("activity.filters.allActions", { defaultValue: "All actions" })}</option>
                  {actionOptions.map((action) => (
                    <option key={action} value={action}>
                      {t(`activity.actions.${action}`, { defaultValue: action.replace(/_/g, " ") })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex justify-content-end">
                <Button variant="secondary" size="sm" type="submit">
                  {t("activity.filters.apply", { defaultValue: "Apply filters" })}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h5 className="card-title mb-0">{t("activity.recentActivity", { defaultValue: "Recent activity" })}</h5>
            <div className="d-flex align-items-center gap-2">
              {viewMode === "tree" && (
                <select
                  className="form-select form-select-sm"
                  value={treeGroupBy}
                  onChange={handleTreeGroupByChange}
                  aria-label={t("activity.groupBy.label", { defaultValue: "Group by" })}
                >
                  <option value="document">{t("activity.groupBy.document", { defaultValue: "Group by document" })}</option>
                  <option value="action">{t("activity.groupBy.action", { defaultValue: "Group by action" })}</option>
                </select>
              )}
              <ActivityViewSwitcher t={t} value={viewMode} onChange={setViewMode} />
            </div>
          </div>
          <div className="card-body">
            {viewMode === "timeline" && (
              <AuditLogsTimeline
                t={t}
                logs={logs}
                loading={loading}
                error={error}
              />
            )}
            {viewMode === "tree" && (
              <AuditLogsTreeView
                t={t}
                logs={logs}
                loading={loading}
                error={error}
                groupBy={treeGroupBy}
              />
            )}

            {!loading && (pagination?.total ?? 0) > 0 && (
              <PaginationSection
                page={pagination?.page ?? 1}
                perPage={pagination?.per_page ?? 50}
                total={pagination?.total}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                disabled={loading}
              />
            )}
          </div>
        </div>
    </PageLayout>
  );
};

export default ArchiveActivityPage;
