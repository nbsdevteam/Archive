import { useMemo, useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Button, MobileActionsMenu } from "../../../shared/components/ui";
import { useViewport } from "@/shared/hooks/useViewport";
import { InfiniteScrollFooter } from "../../../shared/components/InfiniteScrollFooter";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useActivityTimelineFilterStore } from "../../../shared/components/Activity/useActivityTimelineFilterStore";
import { useInfiniteAuditLogs } from "../hooks/useAuditLogs";
import type { ActivityViewMode, AuditLogsQueryParams } from "../types/auditLogs.types";
const ActivityViewSwitcher = lazy(() =>
  import("../../../shared/components/Activity/ActivityViewSwitcher"),
);
/** Lazy-loaded timeline; xyflow-vendor loads only when user switches to tree view. */
const AuditLogsTimeline = lazy(() =>
  import("../../../shared/components/Activity/AuditLogsTimeline"),
);
const AuditLogsTreeView = lazy(() =>
  import("../../../shared/components/Activity/AuditLogsTreeView"),
);
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
  const { isMobileView } = useViewport();
  const [viewMode, setViewMode] = useState<ActivityViewMode>("timeline");
  const [treeGroupBy, setTreeGroupBy] = useState<"document" | "action">(
    "document",
  );
  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [actionInput, setActionInput] = useState("");
  const defaultDateFrom = useMemo(() => getDateDaysAgoFormatted(7), []);

  const [params, setParams] = useState<AuditLogsQueryParams>({ date_from: defaultDateFrom });
  const { logs, loading, error, refetch, paging } = useInfiniteAuditLogs(params);
  /** Hidden action types narrow the rows client-side; don't let the footer auto-load everything. */
  const hasHiddenActions = useActivityTimelineFilterStore((state) => state.hiddenActions.length > 0);

  /** Switches to new filters; re-submitting identical ones still fetches fresh data. */
  const applyParams = (nextParams: AuditLogsQueryParams) => {
    if (JSON.stringify(nextParams) === JSON.stringify(params)) {
      void refetch();
    } else {
      setParams(nextParams);
    }
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

  const handleLast7DaysClick = () => {
    setDateFromInput("");
    setDateToInput("");
    setActionInput("");
    applyParams({ date_from: getDateDaysAgoFormatted(7) });
  };
  const handleLast24HoursClick = () => {
    setDateFromInput("");
    setDateToInput("");
    setActionInput("");
    applyParams({ date_from: getDateDaysAgoFormatted(1) });
  };
  /** Sends date_from/date_to as YYYY-MM-DDTHH:mm:ss per audit-logs API. */
  const handleFiltersSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyParams({
      date_from: dateFromInput
        ? formatDateForAuditApi(dateFromInput, false)
        : params.date_from,
      ...(dateToInput ? { date_to: formatDateForAuditApi(dateToInput, true) } : {}),
      ...(actionInput ? { action: actionInput } : {}),
    });
  };
  const handleDateFromChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setDateFromInput(event.target.value);
  const handleDateToChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setDateToInput(event.target.value);
  const handleActionInputChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => setActionInput(event.target.value);
  const handleTreeGroupByChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => setTreeGroupBy(event.target.value as "document" | "action");

  const pageTitle = t("activity.title", { defaultValue: "Activity" });

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[
        {
          label: t("documents.title", { defaultValue: "Documents" }),
          to: routes.documents,
        },
      ]}
      homeTo={routes.adminDashboard}
      rightContent={
        <>
          {isMobileView ? (
            <MobileActionsMenu
              title={t("common.actions", { defaultValue: "Actions" })}
              items={[
                {
                  id: "last7",
                  icon: "calendar",
                  label: t("activity.last7Days", {
                    defaultValue: "Last 7 days",
                  }),
                  onClick: handleLast7DaysClick,
                },
                {
                  id: "last24",
                  icon: "calendar",
                  label: t("activity.last24Hours", {
                    defaultValue: "Last 24h",
                  }),
                  onClick: handleLast24HoursClick,
                },
              ]}
              triggerAriaLabel={t("common.actions", {
                defaultValue: "Actions",
              })}
            />
          ) : (
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
            </>
          )}
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
              <label className="form-label" htmlFor="activity-date-from">
                {t("activity.filters.dateFrom", { defaultValue: "Date from" })}
              </label>
              <input
                id="activity-date-from"
                type="date"
                className="form-control"
                value={dateFromInput}
                onChange={handleDateFromChange}
                aria-label={t("activity.filters.dateFrom", {
                  defaultValue: "Date from",
                })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="activity-date-to">
                {t("activity.filters.dateTo", { defaultValue: "Date to" })}
              </label>
              <input
                id="activity-date-to"
                type="date"
                className="form-control"
                value={dateToInput}
                onChange={handleDateToChange}
                aria-label={t("activity.filters.dateTo", {
                  defaultValue: "Date to",
                })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="activity-filter-action">
                {t("activity.filters.action", { defaultValue: "Action" })}
              </label>
              <select
                id="activity-filter-action"
                className="form-select"
                value={actionInput}
                onChange={handleActionInputChange}
                aria-label={t("activity.filters.action", {
                  defaultValue: "Action",
                })}
              >
                <option value="">
                  {t("activity.filters.allActions", {
                    defaultValue: "All actions",
                  })}
                </option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {t(`activity.actions.${action}`, {
                      defaultValue: action.replace(/_/g, " "),
                    })}
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
          <h5 className="card-title mb-0">
            {t("activity.recentActivity", { defaultValue: "Recent activity" })}
          </h5>
          <div className="d-flex align-items-center gap-2">
            {viewMode === "tree" && (
              <select
                className="form-select form-select-sm"
                value={treeGroupBy}
                onChange={handleTreeGroupByChange}
                aria-label={t("activity.groupBy.label", {
                  defaultValue: "Group by",
                })}
              >
                <option value="document">
                  {t("activity.groupBy.document", {
                    defaultValue: "Group by document",
                  })}
                </option>
                <option value="action">
                  {t("activity.groupBy.action", {
                    defaultValue: "Group by action",
                  })}
                </option>
              </select>
            )}
            <ActivityViewSwitcher
              t={t}
              value={viewMode}
              onChange={setViewMode}
            />
          </div>
        </div>
        <div className="card-body">
          {viewMode === "timeline" && (
            <AuditLogsTimeline
              t={t}
              logs={logs}
              loading={loading}
              error={error}
              virtualize
            />
          )}
          {viewMode === "tree" && (
            <Suspense
              fallback={
                <div className="py-3 text-center text-muted">
                  Loading tree view…
                </div>
              }
            >
              <AuditLogsTreeView
                t={t}
                logs={logs}
                loading={loading}
                error={error}
                groupBy={treeGroupBy}
              />
            </Suspense>
          )}

          {!loading && (
            <InfiniteScrollFooter
              paging={paging}
              auto={viewMode === "timeline" && !hasHiddenActions}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ArchiveActivityPage;
