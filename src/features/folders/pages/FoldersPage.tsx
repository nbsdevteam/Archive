import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Button, Spinner, Alert, Icon } from "../../../shared/components/ui";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import { useFolders } from "../hooks/useFolders";
import type { Folder } from "../types/folders.types";
import { CreateFolderSidePanel } from "../components";
import "../styles/folders.css";

type ViewMode = "grid" | "list";

/**
 * FoldersPage - Folders management page with cards
 */
const FoldersPage = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  // Stable options so useFolders doesn't see a new object every render (avoids infinite fetch loop)
  const folderListParams = useMemo(() => ({ state: "active" as const }), []);
  const { folders, loading, error, pagination, fetchFolders } = useFolders({
    useApi: true,
    initialParams: folderListParams,
  });

  const handleNavigateToFolder = (folderId: number) => {
    navigate(`${routes.folderDetail.replace(":id", folderId.toString())}`);
  };

  const foldersCountLabel = useMemo(() => {
    if (loading) return "Loading...";
    const count = pagination?.total ?? folders.length;
    return `${count} ${count === 1 ? "folder" : "folders"}`;
  }, [folders.length, loading, pagination?.total]);

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
            <h2 className="mb-1">Folders</h2>
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
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
            <Button variant="secondary" size="md" className="btn-md" onClick={() => setIsCreateFolderOpen(true)}>
              <Icon name="folder-plus" className="me-1" />
              {t("folders.addFolder", { defaultValue: "Add Folder" })}
            </Button>
            <div className="btn-group folders__view-toggle" role="group" aria-label="Folders view toggle">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "grid" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => setViewMode("grid")}
              >
                {t("folders.gridView", { defaultValue: "Grid view" })}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === "list" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => setViewMode("list")}
              >
                {t("folders.listView", { defaultValue: "List view" })}
              </button>
            </div>
            <div className="head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
            <button
              className="btn btn-sm btn-outline-primary ms-2"
              onClick={() => fetchFolders()}
            >
              Retry
            </button>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <Spinner size="md" />
          </div>
        ) : viewMode === "grid" ? (
          <div className="row">
            {folders.length === 0 ? (
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <p className="text-muted mb-0">No folders found</p>
                  </div>
                </div>
              </div>
            ) : (
              folders.map((folder) => (
                <div className="col-xl-3 col-md-6 d-flex" key={folder.id}>
                  <div
                    className="card flex-fill"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigateToFolder(folder.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNavigateToFolder(folder.id);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
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
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="card folders__table-card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Folders</h5>
              <span className="text-muted fs-13">{foldersCountLabel}</span>
            </div>
            <div className="card-body">
              {folders.length === 0 ? (
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
                      {folders.map((folder) => (
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
            </div>
          </div>
        )}
      </div>

      <CreateFolderSidePanel
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onSuccess={() => {
          fetchFolders();
          setIsCreateFolderOpen(false);
        }}
      />
    </div>
  );
};

export default FoldersPage;
