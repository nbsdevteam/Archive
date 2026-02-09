import { useEffect, useMemo, useRef, useState } from "react";
import type { ApexOptions } from "apexcharts";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { handleApiError } from "../../../app/adapter/api/client";
import { useFolders } from "../../folders/hooks/useFolders";
import { useDocumentCount } from "../../documents/hooks/useDocumentCount";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import { useThemeColorStore } from "../../../shared/stores/themeColorStore";
import { groupFoldersByDepartment } from "../utils/groupFoldersByDepartment";

const DOCUMENT_PARAMS = { status: "active" as const, per_page: 1, page: 1 };
const NOTIFICATION_PARAMS = { page: 1, per_page: 10 };

/** Primary color from theme (--primary-rgb) for charts; fallback to default orange if not set */
function getThemePrimaryColor(): string {
  if (typeof document === "undefined") return "rgb(242, 101, 34)";
  const rgb = getComputedStyle(document.documentElement).getPropertyValue("--primary-rgb").trim();
  if (rgb) return `rgb(${rgb})`;
  return "rgb(242, 101, 34)";
}

type DashboardStats = {
  total_documents?: number;
};

export const useLayoutModernDashboardPageContainer = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const themeColor = useThemeColorStore((s) => s.color);

  const {
    folders,
    loading: foldersLoading,
    error: foldersError,
    pagination: foldersPagination,
  } = useFolders({ useApi: true });

  const { count: activeDocumentsCount } = useDocumentCount({
    initialParams: DOCUMENT_PARAMS,
  });

  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
  } = useNotifications({
    useApi: true,
    initialParams: NOTIFICATION_PARAMS,
  });

  const didRunRef = useRef(false);
  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const response = await adminApi.getDashboardStats();
        if (!cancelled && response?.stats) setStats(response.stats);
      } catch (err) {
        if (!cancelled) setStatsError(handleApiError(err));
      }
    })();
    return () => {
      cancelled = true;
      setTimeout(() => {
        didRunRef.current = false;
      }, 0);
    };
  }, []);

  const totalFolders = foldersPagination?.total ?? folders.length;
  const totalDocuments = stats?.total_documents ?? 0;
  const activeDocuments = activeDocumentsCount;

  const chartData = useMemo(() => groupFoldersByDepartment(folders), [folders]);
  const chartOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        height: 280,
        type: "bar",
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 5,
          horizontal: true,
          barHeight: "35%",
          endingShape: "rounded",
        },
      },
      dataLabels: { enabled: false },
      colors: [getThemePrimaryColor()],
      grid: {
        borderColor: "#E5E7EB",
        strokeDashArray: 5,
        padding: { top: -20, left: 0, right: 0, bottom: 0 },
      },
      xaxis: {
        categories: chartData.categories,
        labels: { style: { colors: "#111827", fontSize: "13px" } },
      },
      series: [{ name: "Folders", data: chartData.data }],
    }),
    [chartData, themeColor]
  );

  const loading = foldersLoading || notificationsLoading;
  const hasError = statsError || foldersError || notificationsError;

  return {
    stats,
    statsError,
    folders,
    notifications,
    unreadCount,
    notificationsLoading,
    notificationsError,
    totalFolders,
    totalDocuments,
    activeDocuments,
    chartData,
    chartOptions,
    loading,
    hasError,
  };
};
