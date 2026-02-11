import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { handleApiError } from "../../../app/adapter/api/client";
import { useFolders } from "../../folders/hooks/useFolders";
import { useDocumentCount, useTrashDocumentCount } from "../../documents/hooks";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import { groupFoldersByDepartment } from "../utils/groupFoldersByDepartment";

const DOCUMENT_PARAMS_ARCHIVED = { status: "archived" as const, per_page: 1, page: 1 };
const NOTIFICATION_PARAMS = { page: 1, per_page: 10 };

type DashboardStats = {
  total_documents?: number;
  by_department?: Array<{ department: string; count: number }>;
};

type StatsResult = { stats: DashboardStats; error: null } | { stats: null; error: string };

let statsPromise: Promise<StatsResult> | null = null;

function getDashboardStatsOnce(): Promise<StatsResult> {
  if (statsPromise) return statsPromise;
  statsPromise = (async () => {
    try {
      const res = await adminApi.getDashboardStats();
      const data = res && typeof res === "object" ? res : {};
      const payload =
        "stats" in data && data.stats && typeof data.stats === "object"
          ? data.stats
          : "total_documents" in data || "by_department" in data
            ? data
            : {};
      return { stats: payload as DashboardStats, error: null };
    } catch (err) {
      return { stats: null, error: handleApiError(err) };
    }
  })();
  return statsPromise;
}

export const useDashboardPageContainer = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);

  const {
    folders,
    loading: foldersLoading,
    error: foldersError,
    pagination: foldersPagination,
    fetchFolders,
  } = useFolders({ useApi: true });

  const { count: archivedDocumentsCount } = useDocumentCount({
    initialParams: DOCUMENT_PARAMS_ARCHIVED,
  });

  const { count: trashedDocumentsCount } = useTrashDocumentCount();

  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
  } = useNotifications({
    useApi: true,
    initialParams: NOTIFICATION_PARAMS,
  });

  useEffect(() => {
    let cancelled = false;
    getDashboardStatsOnce().then((result) => {
      if (cancelled) return;
      if (result.error) {
        setStatsError(result.error);
        setStats({});
      } else {
        setStats(result.stats);
        setStatsError(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalFolders = foldersPagination?.total ?? folders.length;
  const activeDocumentsCount = stats?.total_documents ?? 0;

  const documentsByDepartment = useMemo(
    () => stats?.by_department ?? [],
    [stats?.by_department]
  );

  const chartData = useMemo(() => groupFoldersByDepartment(folders), [folders]);
  const foldersByDepartmentItems = useMemo(
    () =>
      chartData.categories.map((department, i) => ({
        department,
        count: chartData.data[i] ?? 0,
      })),
    [chartData]
  );

  const loading = foldersLoading;
  const hasError = statsError || foldersError || notificationsError;

  const handleOpenUploadPanel = () => setUploadPanelOpen(true);
  const handleCloseUploadPanel = () => setUploadPanelOpen(false);

  return {
    stats,
    statsError,
    uploadPanelOpen,
    folders,
    foldersLoading,
    foldersError,
    notifications,
    unreadCount,
    notificationsLoading,
    notificationsError,
    activeDocumentsCount,
    archivedDocumentsCount,
    trashedDocumentsCount,
    totalFolders,
    documentsByDepartment,
    foldersByDepartmentItems,
    loading,
    hasError,
    handleOpenUploadPanel,
    handleCloseUploadPanel,
  };
};
