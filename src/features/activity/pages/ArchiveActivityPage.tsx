import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Icon, Button } from "../../../shared/components/ui";
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
      page: 1,
      per_page: 50,
    },
  });

  /** Applies filters; sends date_from/date_to as YYYY-MM-DDTHH:mm:ss per audit-logs API. */
  const applyFilters = async (nextPage = 1) => {
    const nextParams = {
      ...params,
      page: nextPage,
      date_from: dateFromInput ? formatDateForAuditApi(dateFromInput, false) : params.date_from,
      date_to: dateToInput ? formatDateForAuditApi(dateToInput, true) : undefined,
      action: actionInput || undefined,
    };
    setParams(nextParams);
    await fetchLogs(nextParams);
  };

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

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">{t("activity.title", { defaultValue: "Activity" })}</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={routes.documents}>{t("documents.title", { defaultValue: "Documents" })}</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {t("activity.title", { defaultValue: "Activity" })}
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="btn-outline-secondary"
              onClick={() => {
                const defaultParams = { date_from: getDateDaysAgoFormatted(7), page: 1, per_page: 50 };
                setDateFromInput("");
                setDateToInput("");
                setActionInput("");
                setParams(defaultParams);
                fetchLogs(defaultParams).catch(() => undefined);
              }}
            >
              {t("activity.last7Days", { defaultValue: "Last 7 days" })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="btn-outline-secondary"
              onClick={() => {
                const defaultParams = { date_from: getDateDaysAgoFormatted(1), page: 1, per_page: 50 };
                setDateFromInput("");
                setDateToInput("");
                setActionInput("");
                setParams(defaultParams);
                fetchLogs(defaultParams).catch(() => undefined);
              }}
            >
              {t("activity.last24Hours", { defaultValue: "Last 24h" })}
            </Button>
            <CollapseHeader />
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <form
              className="row g-2 align-items-end"
              onSubmit={(event) => {
                event.preventDefault();
                applyFilters(1).catch(() => undefined);
              }}
            >
              <div className="col-md-3">
                <label className="form-label">{t("activity.filters.dateFrom", { defaultValue: "Date from" })}</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateFromInput}
                  onChange={(event) => setDateFromInput(event.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">{t("activity.filters.dateTo", { defaultValue: "Date to" })}</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateToInput}
                  onChange={(event) => setDateToInput(event.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">{t("activity.filters.action", { defaultValue: "Action" })}</label>
                <select
                  className="form-select"
                  value={actionInput}
                  onChange={(event) => setActionInput(event.target.value)}
                >
                  <option value="">{t("activity.filters.allActions", { defaultValue: "All actions" })}</option>
                  {actionOptions.map((action) => (
                    <option key={action} value={action}>
                      {t(`activity.actions.${action}`, { defaultValue: action.replaceAll("_", " ") })}
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
                  onChange={(event) => setTreeGroupBy(event.target.value as "document" | "action")}
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
              <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 gap-2">
                <span className="text-muted small">
                  {t("activity.paginationInfo", {
                    defaultValue: "Page {{page}}",
                    page: pagination?.page ?? 1,
                  })}
                </span>
                <div className="d-flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-outline-secondary"
                    disabled={(pagination?.page ?? 1) <= 1 || loading}
                    onClick={() => applyFilters((pagination?.page ?? 1) - 1)}
                  >
                    {t("common.previous", { defaultValue: "Previous" })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-outline-secondary"
                    disabled={loading || (logs.length < (pagination?.per_page ?? 50))}
                    onClick={() => applyFilters((pagination?.page ?? 1) + 1)}
                  >
                    {t("common.next", { defaultValue: "Next" })}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveActivityPage;
