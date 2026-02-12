import { useEffect, useMemo, useRef, useState } from "react";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { handleApiError } from "../../../app/adapter/api/client";
import { useFolders } from "../../folders/hooks/useFolders";
import { useDocumentCount, useTrashDocumentCount } from "../../documents/hooks";
import { useNotifications } from "../../notifications/hooks/useNotifications";
import { groupFoldersByDepartment } from "../utils/groupFoldersByDepartment";

// Define constants outside component to prevent recreation on every render
const DOCUMENT_PARAMS_ARCHIVED = { status: "archived" as const, per_page: 1, page: 1 };
const NOTIFICATION_PARAMS = { page: 1, per_page: 10 };

// Define hook options objects outside component to prevent triggering re-fetches
const FOLDERS_OPTIONS = { useApi: true as const };
const ARCHIVED_DOCS_OPTIONS = { initialParams: DOCUMENT_PARAMS_ARCHIVED };
const NOTIFICATIONS_OPTIONS = { useApi: true as const, initialParams: NOTIFICATION_PARAMS };

type DashboardStats = {
  total_documents?: number;
  by_department?: Array<{ department: string; count: number }>;
};

export const useDashboardPageContainer = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const hasFetchedStats = useRef(false);

  const {
    folders,
    loading: foldersLoading,
    error: foldersError,
    pagination: foldersPagination,
    fetchFolders,
  } = useFolders(FOLDERS_OPTIONS);

  const { count: archivedDocumentsCount } = useDocumentCount(ARCHIVED_DOCS_OPTIONS);

  const { count: trashedDocumentsCount } = useTrashDocumentCount();

  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
  } = useNotifications(NOTIFICATIONS_OPTIONS);

  /** Fetches dashboard stats once on mount, protected against StrictMode double calls. */
  useEffect(() => {
    // Prevent double fetch in StrictMode
    if (hasFetchedStats.current) return;
    hasFetchedStats.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.getDashboardStats();
        if (cancelled) return;
        const data = res && typeof res === "object" ? res : {};
        const payload =
          "stats" in data && data.stats && typeof data.stats === "object"
            ? data.stats
            : "total_documents" in data || "by_department" in data
              ? data
              : {};
        setStats(payload as DashboardStats);
        setStatsError(null);
      } catch (err) {
        if (!cancelled) {
          setStatsError(handleApiError(err));
          setStats({});
        }
      }
    })();
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
