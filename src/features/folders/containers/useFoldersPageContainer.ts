import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import { useFolders } from "../hooks/useFolders";
import { filterFoldersBySearch } from "../utils/filterFoldersBySearch";
import { getFolderStatusBadgeVariant } from "../utils/getFolderStatusBadgeVariant";

type ViewMode = "grid" | "list";

export const useFoldersPageContainer = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const folderListParams = useMemo(() => ({ state: "active" as const }), []);
  const { folders, loading, error, pagination, fetchFolders } = useFolders({
    useApi: true,
    initialParams: folderListParams,
  });

  const filteredFolders = useMemo(
    () => filterFoldersBySearch(folders, searchQuery),
    [folders, searchQuery]
  );

  const handleSearchDebounced = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleNavigateToFolder = useCallback(
    (folderId: number) => {
      navigate(`${routes.folderDetail.replace(":id", folderId.toString())}`);
    },
    [navigate, routes.folderDetail]
  );

  const handleOpenCreateFolder = useCallback(() => {
    setIsCreateFolderOpen(true);
  }, []);

  const handleCloseCreateFolder = useCallback(() => {
    setIsCreateFolderOpen(false);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    fetchFolders();
    setIsCreateFolderOpen(false);
  }, [fetchFolders]);

  const handleRefresh = useCallback(() => {
    fetchFolders();
  }, [fetchFolders]);

  const foldersCountLabel = useMemo(() => {
    if (loading) return "Loading...";
    const count = filteredFolders.length;
    return `${count} ${count === 1 ? "folder" : "folders"}`;
  }, [filteredFolders.length, loading]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return formatRelativeTime(new Date(dateStr));
    } catch {
      return "-";
    }
  };

  const handleGridKeyDown = (folderId: number, e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigateToFolder(folderId);
    }
  };

  return {
    routes,
    viewMode,
    setViewMode,
    isCreateFolderOpen,
    folders,
    filteredFolders,
    loading,
    error,
    pagination,
    foldersCountLabel,
    handleSearchDebounced,
    handleNavigateToFolder,
    handleOpenCreateFolder,
    handleCloseCreateFolder,
    handleCreateSuccess,
    handleRefresh,
    formatDate,
    handleGridKeyDown,
    getFolderStatusBadgeVariant,
  };
};
