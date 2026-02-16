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

function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export function FoldersContent(props: FoldersContentProps) {
  const { t, routes, filteredFolders, viewMode, loading, error, formatDate, actions, onDeleteClick } = props;

  const handleGridCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const id = e.currentTarget.dataset.folderId;
    if (id != null) actions.handleNavigateToFolder(Number(id));
  };
  const handleGridCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const id = e.currentTarget.dataset.folderId;
    if (id != null) actions.handleGridKeyDown(Number(id), e);
  };
  const handleEditFolderClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const id = e.currentTarget.dataset.folderId;
    const folder = id != null ? filteredFolders.find((f) => f.id === Number(id)) : undefined;
    if (folder) actions.handleOpenEditFolder(folder);
  };
  const handleDeleteFolderClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const id = e.currentTarget.dataset.folderId;
    if (id != null) onDeleteClick(Number(id));
  };
  const handleListRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const id = e.currentTarget.dataset.folderId;
    if (id != null) actions.handleNavigateToFolder(Number(id));
  };
  const handleListViewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.folderId;
    if (id != null) actions.handleNavigateToFolder(Number(id));
  };
  const handleListEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.folderId;
    const folder = id != null ? filteredFolders.find((f) => f.id === Number(id)) : undefined;
    if (folder) actions.handleOpenEditFolder(folder);
  };
  const handleListDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.folderId;
    if (id != null) onDeleteClick(Number(id));
  };

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
                <div className="folders__grid-card-wrapper" role="button" tabIndex={0} data-folder-id={folder.id} onClick={handleGridCardClick} onKeyDown={handleGridCardKeyDown} aria-label={t("folders.openFolder", { defaultValue: "Open folder" }) + ` ${folder.name}`}>
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
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-auto" onClick={stopPropagation}>
                        <Link to={routes.folderDetail.replace(":id", String(folder.id))} className="link-primary fs-13">
                          {t("common.view", { defaultValue: "View" })}
                        </Link>
                        <button type="button" className="btn btn-sm btn-link p-0 text-primary" data-folder-id={folder.id} onClick={handleEditFolderClick}>
                          {t("folders.edit", { defaultValue: "Edit" })}
                        </button>
                        <button type="button" className="btn btn-sm btn-link p-0 text-danger" data-folder-id={folder.id} onClick={handleDeleteFolderClick} aria-label={t("folders.deleteFolder", { defaultValue: "Delete folder" })}>
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
                <tr key={folder.id} style={{ cursor: "pointer" }} data-folder-id={folder.id} onClick={handleListRowClick}>
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
                    <Button variant="outline" size="sm" className="btn-outline-secondary me-1" data-folder-id={folder.id} onClick={handleListViewClick}>
                      {t("common.view", { defaultValue: "View" })}
                    </Button>
                    <Button variant="outline" size="sm" className="btn-outline-secondary me-1" data-folder-id={folder.id} onClick={handleListEditClick}>
                      {t("folders.edit", { defaultValue: "Edit" })}
                    </Button>
                    <Button variant="outline" size="sm" className="btn-outline-danger" data-folder-id={folder.id} onClick={handleListDeleteClick} aria-label={t("folders.deleteFolder", { defaultValue: "Delete folder" })}>
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
