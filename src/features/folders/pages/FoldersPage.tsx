import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Button, Spinner, Alert, Icon, SearchInput, Card, ListFilter, ConfirmModal } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { TablePageToolbar } from "../../../shared/components/TablePageToolbar";
import { useConfirmDialog } from "../../../shared/hooks";
import { EditFolderSidePanel } from "../components";
import { useFoldersPageContainer } from "../containers/useFoldersPageContainer";
import "../styles/folders.css";

/**
 * FoldersPage - Folders management page with cards. Uses useConfirmDialog for delete (DRY).
 */
const FoldersPage = () => {
  const { t } = useTranslation();
  const { data, loading, error, filter, actions, modals } = useFoldersPageContainer();
  const {
    routes,
    viewMode,
    setViewMode,
    folders,
    filteredFolders,
    foldersCountLabel,
    formatDate,
  } = data;
  const deleteFolderDialog = useConfirmDialog<number>({ onConfirm: actions.confirmDeleteFolder });

  const pageTitle = t("folders.title", { defaultValue: "Folders" });

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card folders__table-card">
          <TablePageToolbar
            title={<h5 className="card-title mb-0">{t("folders.title", { defaultValue: "Folders" })}</h5>}
            countSlot={foldersCountLabel}
            rightClassName="folders__header-actions"
          >
              <SearchInput
                placeholder={t("folders.searchPlaceholder", { defaultValue: "Search folders..." })}
                debounceMs={300}
                onDebouncedChange={actions.handleSearchDebounced}
                icon="folder-search"
                wide
                highlight
                className="folders__search-wrap"
                inputClassName="folders__search-input"
                aria-label={t("folders.searchAria", { defaultValue: "Search folders" })}
              />
              <div className="position-relative d-inline-block">
                <Button
                  variant="outline"
                  size="md"
                  className="btn-outline-secondary"
                  onClick={filter.handleOpenFilter}
                  aria-label={t("folders.filter", { defaultValue: "Filter" })}
                  aria-expanded={filter.isFilterOpen}
                >
                  <Icon name="filter" className="me-1" />
                  {t("folders.filter", { defaultValue: "Filter" })}
                </Button>
                <ListFilter
                  isOpen={filter.isFilterOpen}
                  onClose={filter.handleCloseFilter}
                  primaryFilter={{
                    label: t("folders.department", { defaultValue: "Department" }),
                    value: filter.draftFilters.department_id ?? null,
                    options: filter.departmentOptions,
                    onChange: filter.handlePrimaryFilterChange,
                  }}
                  secondaryFilter={{
                    label: t("folders.folderType", { defaultValue: "Folder type" }),
                    value: filter.draftFilters.folder_type ?? null,
                    options: filter.folderTypeOptions,
                    onChange: filter.handleSecondaryFilterChange,
                  }}
                  onApply={filter.handleApplyFilter}
                  onClear={filter.handleClearFilter}
                  applyDisabled={filter.filterApplyDisabled}
                  applyLabel={t("common.apply", { defaultValue: "Apply" })}
                  clearLabel={t("common.clear", { defaultValue: "Clear" })}
                  closeAriaLabel={t("common.close", { defaultValue: "Close filter" })}
                  ariaLabel={t("folders.filterOptions", { defaultValue: "Filter options" })}
                />
              </div>
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
                  onClick={() => data.setViewMode("grid")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      data.setViewMode("grid");
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
                  onClick={() => data.setViewMode("list")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      data.setViewMode("list");
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
                onClick={actions.handleRefresh}
                disabled={loading}
                aria-label={t("folders.refreshAria", { defaultValue: "Refresh folders" })}
              >
                <Icon name="refresh-cw" style={{ width: "1rem", height: "1rem" }} />
              </Button>
          </TablePageToolbar>
          <div className="card-body h-min-50vh">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <Button variant="outline" size="sm" className="btn-outline-secondary ms-2" onClick={actions.handleRefresh}>
                  {t("common.retry", { defaultValue: "Retry" })}
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
                  <div className="col-12 text-center py-5 text-muted">{t("folders.noFoldersFound", { defaultValue: "No folders found" })}</div>
                ) : (
                  filteredFolders.map((folder) => (
                    <div className="col-xl-3 col-md-6 d-flex" key={folder.id}>
                      <div
                        className="flex-fill"
                        role="button"
                        tabIndex={0}
                        onClick={() => actions.handleNavigateToFolder(folder.id)}
                        onKeyDown={(e) => actions.handleGridKeyDown(folder.id, e)}
                        style={{ cursor: "pointer" }}
                      >
                        <Card className="flex-fill" bordered={false}>
                          <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <span className="folders__folder-icon p-2 br-10 d-flex align-items-center justify-content-center">
                              <Icon name="folder" className="folders__folder-icon-symbol fs-18" />
                            </span>
                            <span className="badge bg-light text-dark">
                              {t("folders.updated", { defaultValue: "Updated" })} {formatDate(folder.updated_at ?? folder.create_date ?? folder.updated)}
                            </span>
                          </div>
                          <h5 className="mb-1">{folder.name}</h5>
                          <p className="text-muted mb-2">
                            <small>{t("folders.code", { defaultValue: "Code" })}: {folder.code}</small>
                          </p>
                          <p className="text-muted mb-3">
                            {folder.document_count ?? folder.docs ?? 0} documents
                            {folder.department_name && ` • ${folder.department_name}`}
                          </p>
                          <div className="d-flex flex-wrap gap-2 align-items-center" onClick={(e) => e.stopPropagation()}>
                            <Link
                              to={routes.folderDetail.replace(":id", String(folder.id))}
                              className="link-primary fs-13"
                            >
                              {t("common.view", { defaultValue: "View" })}
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-primary"
                              onClick={(e) => { e.preventDefault(); actions.handleOpenEditFolder(folder); }}
                            >
                              {t("folders.edit", { defaultValue: "Edit" })}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-danger"
                              onClick={(e) => { e.preventDefault(); deleteFolderDialog.open(folder.id); }}
                              aria-label={t("folders.deleteFolder", { defaultValue: "Delete folder" })}
                            >
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
            ) : (
              <>
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
                          <tr
                            key={folder.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => actions.handleNavigateToFolder(folder.id)}
                          >
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
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-secondary me-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  actions.handleNavigateToFolder(folder.id);
                                }}
                              >
                                {t("common.view", { defaultValue: "View" })}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-secondary me-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  actions.handleOpenEditFolder(folder);
                                }}
                              >
                                {t("folders.edit", { defaultValue: "Edit" })}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFolderDialog.open(folder.id);
                                }}
                                aria-label={t("folders.deleteFolder", { defaultValue: "Delete folder" })}
                              >
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
              </>
            )}
          </div>
        </div>

        <ConfirmModal
          {...deleteFolderDialog.modalProps}
          title={t("folders.deleteFolder", { defaultValue: "Delete folder" })}
          message={t("folders.confirmDeleteFolder", { defaultValue: "Are you sure you want to delete this folder? Documents may be affected." })}
          confirmLabel={t("folders.delete", { defaultValue: "Delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          confirmVariant="danger"
        />

        <EditFolderSidePanel
          isOpen={modals.editingFolder != null}
          onClose={actions.handleCloseEditFolder}
          folder={modals.editingFolder}
          onSuccess={actions.handleEditFolderSuccess}
        />
    </PageLayout>
  );
};

export default FoldersPage;
