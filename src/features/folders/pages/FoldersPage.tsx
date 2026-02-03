import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Button, Spinner, Alert, Icon, SearchInput, Card } from "../../../shared/components/ui";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import { useFolders } from "../hooks/useFolders";
import type { Folder } from "../types/folders.types";
import { CreateFolderSidePanel } from "../components";
import "../styles/folders.css";

type ViewMode = "grid" | "list";

function filterFoldersBySearch(folders: Folder[], query: string): Folder[] {
  const q = query.trim().toLowerCase();
  if (!q) return folders;
  return folders.filter(
    (f) =>
      (f.name ?? "").toLowerCase().includes(q) ||
      (f.code ?? "").toLowerCase().includes(q)
  );
}

/**
 * FoldersPage - Folders management page with cards
 */
const FoldersPage = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Stable options so useFolders doesn't see a new object every render (avoids infinite fetch loop)
  const folderListParams = useMemo(() => ({ state: "active" as const }), []);
  const { folders, loading, error, pagination, fetchFolders } = useFolders({
    useApi: true,
    initialParams: folderListParams,
  });

  const filteredFolders = useMemo(
    () => filterFoldersBySearch(folders, searchQuery),
    [folders, searchQuery]
  );

  const onSearchDebounced = useCallback((value: string) => {
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

  const getStatusBadgeVariant = (status?: string | null) => {
    const s = (status ?? "").toLowerCase();
    if (s === "active") return "success";
    if (s === "inactive") return "secondary";
    if (s === "archived") return "warning";
    if (s === "deleted") return "danger";
    return "light";
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">Folders</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Folders
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="ms-2 head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>

        <div className="card folders__table-card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0">Folders</h5>
              <span className="text-muted fs-13">{foldersCountLabel}</span>
            </div>
            <div className="d-flex align-items-center gap-2 folders__header-actions">
              <SearchInput
                placeholder={t("folders.searchPlaceholder", { defaultValue: "Search folders..." })}
                debounceMs={300}
                onDebouncedChange={onSearchDebounced}
                icon="folder-search"
                wide
                highlight
                className="folders__search-wrap"
                inputClassName="folders__search-input"
                aria-label="Search folders"
              />
              
              <Button variant="outline" size="md" className="btn-outline-secondary" onClick={handleOpenCreateFolder}>
                <Icon name="folder-plus" className="me-1" />
                {t("folders.addFolder", { defaultValue: "Add Folder" })}
              </Button>
              <div
                className="folders__view-toggle"
                role="group"
                aria-label="Folders view toggle"
              >
                <div
                  className={`folders__view-toggle-slider ${viewMode === "list" ? "folders__view-toggle-slider--list" : ""}`}
                  aria-hidden
                />
                <div
                  role="button"
                  tabIndex={0}
                  className={`folders__view-option ${viewMode === "grid" ? "folders__view-option--active-grid" : ""}`}
                  onClick={() => setViewMode("grid")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setViewMode("grid");
                    }
                  }}
                  aria-pressed={viewMode === "grid"}
                >
                  {t("folders.gridView", { defaultValue: "Grid view" })}
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  className={`folders__view-option ${viewMode === "list" ? "folders__view-option--active-list" : ""}`}
                  onClick={() => setViewMode("list")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setViewMode("list");
                    }
                  }}
                  aria-pressed={viewMode === "list"}
                >
                  {t("folders.listView", { defaultValue: "List view" })}
                </div>
              </div>
              <Button
                variant="outline"
                size="md"
                className="btn-outline-secondary"
                onClick={handleRefresh}
                disabled={loading}
                aria-label="Refresh folders"
              >
                <Icon name="refresh-cw" style={{ width: "1rem", height: "1rem" }} />
              </Button>
            </div>
          </div>
          <div className="card-body">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <Button variant="outline" size="sm" className="btn-outline-secondary ms-2" onClick={() => fetchFolders()}>
                  Retry
                </Button>
              </Alert>
            )}
            {loading ? (
              <div className="text-center py-4">
                <Spinner size="md" />
              </div>
            ) : viewMode === "grid" ? (
              <div className="row g-3">
                {filteredFolders.length === 0 ? (
                  <div className="col-12 text-center py-5 text-muted">No folders found</div>
                ) : (
                  filteredFolders.map((folder) => (
                    <div className="col-xl-3 col-md-6 d-flex" key={folder.id}>
                      <div
                        className="flex-fill"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNavigateToFolder(folder.id)}
                        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleNavigateToFolder(folder.id);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <Card className="flex-fill" bordered={false}>
                          <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <span className="p-2 br-10 bg-primary-transparent border border-primary d-flex align-items-center justify-content-center">
                              <Icon name="folder" className="text-primary fs-18" />
                            </span>
                            <span className="badge bg-light text-dark">
                              Updated {formatDate(folder.updated_at ?? folder.create_date ?? folder.updated)}
                            </span>
                          </div>
                          <h5 className="mb-1">{folder.name}</h5>
                          <p className="text-muted mb-2">
                            <small>Code: {folder.code}</small>
                          </p>
                          <p className="text-muted mb-3">
                            {folder.document_count ?? folder.docs ?? 0} documents
                            {folder.department_name && ` • ${folder.department_name}`}
                          </p>
                          <Link
                            to={routes.folderDetail.replace(":id", String(folder.id))}
                            className="link-primary fs-13"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View documents
                          </Link>
                          </div>
                        </Card>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {filteredFolders.length === 0 ? (
                  <div className="text-center py-4 text-muted">No folders found</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Code</th>
                          <th>Type</th>
                          <th>Department</th>
                          <th>Documents</th>
                          <th>Status</th>
                          <th>Updated</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFolders.map((folder) => (
                          <tr
                            key={folder.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleNavigateToFolder(folder.id)}
                          >
                            <td>{folder.name || "-"}</td>
                            <td>{folder.code || "-"}</td>
                            <td>{folder.folder_type || "-"}</td>
                            <td>{folder.department_name || "-"}</td>
                            <td>{folder.document_count ?? folder.docs ?? 0}</td>
                            <td>
                              <span className={`badge bg-${getStatusBadgeVariant(folder.state)}`}>
                                {folder.state || "unknown"}
                              </span>
                            </td>
                            <td>{formatDate(folder.updated_at ?? folder.create_date ?? folder.updated)}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-light"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavigateToFolder(folder.id);
                                }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CreateFolderSidePanel
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default FoldersPage;
