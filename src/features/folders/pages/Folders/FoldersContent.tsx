import { Link } from "react-router-dom";
import type { TFunction } from "i18next";
import { Button, Spinner, Alert, Icon, Card, InfoWrapper } from "@/shared/components/ui";
import type { Folder } from "../../types/folders.types";

export interface FoldersContentProps {
  t: TFunction;
  routes: Record<string, string>;
  filteredFolders: Folder[];
  viewMode: "grid" | "list";
  loading: boolean;
  error: string | null;
  formatDate: (date?: string) => string;
  actions: {
    handleRefresh: () => void;
    handleNavigateToFolder: (id: number) => void;
    handleGridKeyDown: (id: number, e: React.KeyboardEvent) => void;
    handleOpenEditFolder: (folder: Folder) => void;
    getFolderStatusBadgeVariant: (state?: string) => string;
  };
  onDeleteClick: (folderId: number) => void;
}

export function FoldersContent(props: FoldersContentProps) {
  const { t, routes, filteredFolders, viewMode, loading, error, formatDate, actions, onDeleteClick } = props;

  if (error) {
    return (
      <div className="card-body h-min-50vh">
        <Alert variant="danger" className="mb-3">
          {error}
          <Button variant="outline" size="sm" className="btn-outline-secondary ms-2" onClick={actions.handleRefresh}>
            {t("common.retry", { defaultValue: "Retry" })}
          </Button>
        </Alert>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="card-body h-min-50vh">
        <div className="text-center py-4">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="card-body h-min-50vh">
        <div className="row g-3">
          {filteredFolders.length === 0 ? (
            <div className="col-12 text-center py-5 text-muted">{t("folders.noFoldersFound", { defaultValue: "No folders found" })}</div>
          ) : (
            filteredFolders.map((folder) => (
              <div className="col-xl-3 col-md-6" key={folder.id}>
                <div className="folders__grid-card-wrapper" role="button" tabIndex={0} onClick={() => actions.handleNavigateToFolder(folder.id)} onKeyDown={(e) => actions.handleGridKeyDown(folder.id, e)}>
                  <Card className="folders__grid-card" bordered={false}>
                    <div className="card-body folders__grid-card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="folders__folder-icon p-2 br-10 d-flex align-items-center justify-content-center">
                          <Icon name="folder" className="folders__folder-icon-symbol fs-18" />
                        </span>
                        <span className="badge bg-light text-dark">
                          {t("folders.updated", { defaultValue: "Updated" })} {formatDate(folder.updated_at ?? folder.create_date ?? folder.updated)}
                        </span>
                      </div>
                      <div className="folders__folder-name-wrapper mb-1">
                        <InfoWrapper
                          content={folder.name}
                          position="top"
                          trigger={
                            <h5 className="folders__folder-name-ellipsis mb-0">
                              {folder.name}
                            </h5>
                          }
                        />
                      </div>
                      <p className="text-muted mb-2">
                        <small>{t("folders.code", { defaultValue: "Code" })}: {folder.code}</small>
                      </p>
                      <p className="text-muted mb-3">
                        {folder.document_count ?? folder.docs ?? 0} documents
                        {folder.department_name && ` • ${folder.department_name}`}
                      </p>
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-auto" onClick={(e) => e.stopPropagation()}>
                        <Link to={routes.folderDetail.replace(":id", String(folder.id))} className="link-primary fs-13">
                          {t("common.view", { defaultValue: "View" })}
                        </Link>
                        <button type="button" className="btn btn-sm btn-link p-0 text-primary" onClick={(e) => { e.preventDefault(); actions.handleOpenEditFolder(folder); }}>
                          {t("folders.edit", { defaultValue: "Edit" })}
                        </button>
                        <button type="button" className="btn btn-sm btn-link p-0 text-danger" onClick={(e) => { e.preventDefault(); onDeleteClick(folder.id); }} aria-label={t("folders.deleteFolder", { defaultValue: "Delete folder" })}>
                          {t("folders.delete", { defaultValue: "Delete" })}
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card-body h-min-50vh">
      {filteredFolders.length === 0 ? (
        <div className="text-center py-4 text-muted">{t("folders.noFoldersFound", { defaultValue: "No folders found" })}</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped mb-0">
            <thead>
              <tr>
                <th>{t("documents.name", { defaultValue: "Name" })}</th>
                <th>{t("folders.code", { defaultValue: "Code" })}</th>
                <th>{t("documents.type", { defaultValue: "Type" })}</th>
                <th>{t("documents.department", { defaultValue: "Department" })}</th>
                <th>{t("documents.documents", { defaultValue: "Documents" })}</th>
                <th>{t("documents.status", { defaultValue: "Status" })}</th>
                <th>{t("folders.updated", { defaultValue: "Updated" })}</th>
                <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {filteredFolders.map((folder) => (
                <tr key={folder.id} style={{ cursor: "pointer" }} onClick={() => actions.handleNavigateToFolder(folder.id)}>
                  <td>{folder.name || "-"}</td>
                  <td>{folder.code || "-"}</td>
                  <td>{folder.folder_type || "-"}</td>
                  <td>{folder.department_name || "-"}</td>
                  <td>{folder.document_count ?? folder.docs ?? 0}</td>
                  <td>
                    <span className={`badge bg-${actions.getFolderStatusBadgeVariant(folder.state)}`}>
                      {folder.state || "unknown"}
                    </span>
                  </td>
                  <td>{formatDate(folder.updated_at ?? folder.create_date ?? folder.updated)}</td>
                  <td className="text-end">
                    <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={(e) => { e.stopPropagation(); actions.handleNavigateToFolder(folder.id); }}>
                      {t("common.view", { defaultValue: "View" })}
                    </Button>
                    <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={(e) => { e.stopPropagation(); actions.handleOpenEditFolder(folder); }}>
                      {t("folders.edit", { defaultValue: "Edit" })}
                    </Button>
                    <Button variant="outline" size="sm" className="btn-outline-danger" onClick={(e) => { e.stopPropagation(); onDeleteClick(folder.id); }} aria-label={t("folders.deleteFolder", { defaultValue: "Delete folder" })}>
                      <Icon name="trash" className="me-1" />
                      {t("folders.delete", { defaultValue: "Delete" })}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
