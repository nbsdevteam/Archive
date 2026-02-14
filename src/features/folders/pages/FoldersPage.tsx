import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Button, Spinner, Alert, Icon, SearchInput, Card, ListFilter, ConfirmModal } from "../../../shared/components/ui";
import { EditFolderSidePanel } from "../components";
import { useFoldersPageContainer } from "../containers/useFoldersPageContainer";
import "../styles/folders.css";

/**
 * FoldersPage - Folders management page with cards
 */
const FoldersPage = () => {
  const { t } = useTranslation();
  const {
    routes,
    viewMode,
    setViewMode,
    folders,
    filteredFolders,
    loading,
    error,
    foldersCountLabel,
    handleSearchDebounced,
    handleNavigateToFolder,
    handleRefresh,
    formatDate,
    handleGridKeyDown,
    getFolderStatusBadgeVariant,
    isFilterOpen,
    draftFilters,
    departmentOptions,
    folderTypeOptions,
    handleOpenFilter,
    handleCloseFilter,
    handlePrimaryFilterChange,
    handleSecondaryFilterChange,
    handleApplyFilter,
    handleClearFilter,
    filterApplyDisabled,
    deleteFolderId,
    isDeletingFolder,
    handleOpenDeleteFolder,
    handleCloseDeleteConfirm,
    handleConfirmDeleteFolder,
    editingFolder,
    handleOpenEditFolder,
    handleCloseEditFolder,
    handleEditFolderSuccess,
  } = useFoldersPageContainer();

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
                onDebouncedChange={handleSearchDebounced}
                icon="folder-search"
                wide
                highlight
                className="folders__search-wrap"
                inputClassName="folders__search-input"
                aria-label="Search folders"
              />
              <div className="position-relative d-inline-block">
                <Button
                  variant="outline"
                  size="md"
                  className="btn-outline-secondary"
                  onClick={handleOpenFilter}
                  aria-label={t("folders.filter", { defaultValue: "Filter" })}
                  aria-expanded={isFilterOpen}
                >
                  <Icon name="filter" className="me-1" />
                  {t("folders.filter", { defaultValue: "Filter" })}
                </Button>
                <ListFilter
                  isOpen={isFilterOpen}
                  onClose={handleCloseFilter}
                  primaryFilter={{
                    label: t("folders.department", { defaultValue: "Department" }),
                    value: draftFilters.department_id ?? null,
                    options: departmentOptions,
                    onChange: handlePrimaryFilterChange,
                  }}
                  secondaryFilter={{
                    label: t("folders.folderType", { defaultValue: "Folder type" }),
                    value: draftFilters.folder_type ?? null,
                    options: folderTypeOptions,
                    onChange: handleSecondaryFilterChange,
                  }}
                  onApply={handleApplyFilter}
                  onClear={handleClearFilter}
                  applyDisabled={filterApplyDisabled}
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
          <div className="card-body h-min-50vh">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <Button variant="outline" size="sm" className="btn-outline-secondary ms-2" onClick={handleRefresh}>
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
                        onKeyDown={(e) => handleGridKeyDown(folder.id, e)}
                        style={{ cursor: "pointer" }}
                      >
                        <Card className="flex-fill" bordered={false}>
                          <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <span className="folders__folder-icon p-2 br-10 d-flex align-items-center justify-content-center">
                              <Icon name="folder" className="folders__folder-icon-symbol fs-18" />
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
                              onClick={(e) => { e.preventDefault(); handleOpenEditFolder(folder); }}
                            >
                              {t("folders.edit", { defaultValue: "Edit" })}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-danger"
                              onClick={(e) => { e.preventDefault(); handleOpenDeleteFolder(folder.id); }}
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
                              <span className={`badge bg-${getFolderStatusBadgeVariant(folder.state)}`}>
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
                                  handleNavigateToFolder(folder.id);
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
                                  handleOpenEditFolder(folder);
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
                                  handleOpenDeleteFolder(folder.id);
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
          isOpen={deleteFolderId != null}
          onClose={handleCloseDeleteConfirm}
          onConfirm={handleConfirmDeleteFolder}
          title={t("folders.deleteFolder", { defaultValue: "Delete folder" })}
          message={t("folders.confirmDeleteFolder", { defaultValue: "Are you sure you want to delete this folder? Documents may be affected." })}
          confirmLabel={t("folders.delete", { defaultValue: "Delete" })}
          cancelLabel={t("common.cancel")}
          confirmVariant="danger"
          isLoading={isDeletingFolder}
        />

        <EditFolderSidePanel
          isOpen={editingFolder != null}
          onClose={handleCloseEditFolder}
          folder={editingFolder}
          onSuccess={handleEditFolderSuccess}
        />
      </div>
    </div>
  );
};

export default FoldersPage;
