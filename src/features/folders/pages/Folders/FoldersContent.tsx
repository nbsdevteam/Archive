import { useCallback, useMemo, useRef, useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import type { TFunction } from "i18next";
import { Button, DataTable, Spinner, Alert, Icon, InfoWrapper } from "@/shared/components/ui";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
import type { RowAction, SelectionConfig } from "@/shared/components/ui/DataTable/DataTable.types";
import { useWindowVirtualList } from "@/shared/hooks/useWindowVirtualList";
import type { Folder } from "../../types/folders.types";

/** Matches the card's col-xl-3 col-md-6 classes: cards per row at each breakpoint. */
const GRID_XL_QUERY = "(min-width: 1200px)";
const GRID_MD_QUERY = "(min-width: 768px)";

function subscribeToGridBreakpoints(onChange: () => void) {
  const queries = [window.matchMedia(GRID_XL_QUERY), window.matchMedia(GRID_MD_QUERY)];
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
}

function getGridColumnCount() {
  if (window.matchMedia(GRID_XL_QUERY).matches) return 4;
  return window.matchMedia(GRID_MD_QUERY).matches ? 2 : 1;
}

export interface FoldersContentProps {
  t: TFunction;
  routes: Record<string, string>;
  filteredFolders: Folder[];
  viewMode: "grid" | "list";
  loading: boolean;
  error: string | null;
  formatDate: (date?: string) => string;
  selectionConfig?: SelectionConfig<Folder>;
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

/**
 * Renders the folder name with truncation (ellipsis). The InfoWrapper tooltip is shown
 * only when the text is actually clipped — detected by comparing scrollWidth to clientWidth
 * after mount. Uses portal mode so the tooltip escapes the card's overflow:hidden container.
 */
function FolderNameWithTooltip({ name }: { name: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  /** Check after mount (and whenever name changes) whether the heading text is clipped. */
  useEffect(() => {
    const el = headingRef.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [name]);

  return (
    <InfoWrapper
      content={name}
      position="top"
      portal
      disabled={!isTruncated}
      trigger={
        <h5 ref={headingRef} className="folders__folder-name-ellipsis mb-0">
          {name}
        </h5>
      }
    />
  );
}

export function FoldersContent(props: FoldersContentProps) {
  const { t, routes, filteredFolders, viewMode, loading, error, formatDate, actions, onDeleteClick, selectionConfig } = props;

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

  const isGridVirtual = viewMode === "grid" && !loading && !error && filteredFolders.length > 0;
  const gridColumnCount = useSyncExternalStore(subscribeToGridBreakpoints, getGridColumnCount);
  const getGridRowKey = useCallback(
    (index: number) => filteredFolders[index * gridColumnCount]?.id ?? index,
    [filteredFolders, gridColumnCount]
  );
  const gridList = useWindowVirtualList<HTMLDivElement>({
    count: Math.ceil(filteredFolders.length / gridColumnCount),
    estimateSize: 230,
    getItemKey: getGridRowKey,
    overscan: 2,
    enabled: isGridVirtual,
  });

  const listColumns: ColumnDef<Folder>[] = useMemo(
    () => [
      { id: "name", header: t("documents.name", { defaultValue: "Name" }), truncate: true, render: (row) => row.name || "–" },
      { id: "code", header: t("folders.code", { defaultValue: "Code" }), truncate: true, render: (row) => row.code || "–" },
      { id: "folder_type", header: t("documents.type", { defaultValue: "Type" }), truncate: true, render: (row) => row.folder_type || "–" },
      { id: "department_name", header: t("documents.department", { defaultValue: "Department" }), truncate: true, render: (row) => row.department_name || "–" },
      { id: "company_name", header: t("folders.companyBrand", { defaultValue: "Company/Brand" }), truncate: true, render: (row) => row.company_name ?? "–" },
      { id: "document_count", header: t("documents.documents", { defaultValue: "Documents" }), render: (row) => row.document_count ?? row.docs ?? 0 },
      { id: "status", header: t("documents.status", { defaultValue: "Status" }), render: (row) => <span className={`badge bg-${actions.getFolderStatusBadgeVariant(row.state)}`}>{row.state || "unknown"}</span> },
      { id: "updated", header: t("folders.updated", { defaultValue: "Updated" }), render: (row) => formatDate(row.last_modified ?? row.updated_at ?? row.write_date ?? row.create_date ?? row.updated) },
    ],
    [t, formatDate, actions.getFolderStatusBadgeVariant]
  );

  const listRowActions: RowAction<Folder>[] = useMemo(
    () => [
      { id: "view", label: t("common.view", { defaultValue: "View" }), icon: "eye", onClick: (row, e) => { e.stopPropagation(); actions.handleNavigateToFolder(row.id); } },
      { id: "edit", label: t("folders.edit", { defaultValue: "Edit" }), icon: "pencil", onClick: (row, e) => { e.stopPropagation(); actions.handleOpenEditFolder(row); } },
      { id: "delete", label: t("folders.delete", { defaultValue: "Delete" }), icon: "trash-2", variant: "danger", onClick: (row, e) => { e.stopPropagation(); onDeleteClick(row.id); } },
    ],
    [t, actions, onDeleteClick]
  );

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
        {filteredFolders.length === 0 ? (
          <div className="row g-3">
            <div className="col-12 text-center py-5 text-muted">{t("folders.noFoldersFound", { defaultValue: "No folders found" })}</div>
          </div>
        ) : (
          <div
            ref={gridList.containerRef}
            style={{ paddingTop: gridList.paddingTop, paddingBottom: gridList.paddingBottom, overflowAnchor: "none" }}
          >
            {gridList.virtualItems.map((virtualRow) => (
              <div
                key={virtualRow.key}
                ref={gridList.measureElement}
                data-index={virtualRow.index}
                // Each virtual row is its own .row; pb-3 restores the gutter a single wrapping .row gave.
                className="pb-3"
                style={{ display: "flow-root" }}
              >
                <div className="row g-3">
                  {filteredFolders
                    .slice(virtualRow.index * gridColumnCount, (virtualRow.index + 1) * gridColumnCount)
                    .map((folder) => (
              <div className="col-xl-3 col-md-6" key={folder.id}>
                <div className="folders__grid-card-wrapper" role="button" tabIndex={0} data-folder-id={folder.id} onClick={handleGridCardClick} onKeyDown={handleGridCardKeyDown} aria-label={folder.name}>
                  <div className="card folders__grid-card">
                    <div className="card-body folders__grid-card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="folders__folder-icon p-2 br-10 d-flex align-items-center justify-content-center">
                          <Icon name="folder" className="folders__folder-icon-symbol fs-18" />
                        </span>
                        <span className="badge bg-light text-dark">
                          {t("folders.updated", { defaultValue: "Updated" })} {formatDate(folder.last_modified ?? folder.updated_at ?? folder.write_date ?? folder.create_date ?? folder.updated)}
                        </span>
                      </div>
                      <div className="folders__folder-name-wrapper mb-1">
                        <FolderNameWithTooltip name={folder.name} />
                      </div>
                      <p className="text-muted mb-2">
                        <small>{t("folders.code", { defaultValue: "Code" })}: {folder.code}</small>
                      </p>
                      <p className="text-muted mb-3">
                        {folder.document_count ?? folder.docs ?? 0} documents
                        {folder.department_name && ` • ${folder.department_name}`}
                        {folder.company_name && ` • ${folder.company_name}`}
                      </p>
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-auto mobile-margin-block-5" onClick={stopPropagation}>
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
                  </div>
                </div>
              </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card-body h-min-50vh">
      <DataTable<Folder>
        data={filteredFolders}
        getRowId={(row) => row.id}
        columns={listColumns}
        loading={loading}
        emptyMessage={t("folders.noFoldersFound", { defaultValue: "No folders found" })}
        onRowClick={(row) => actions.handleNavigateToFolder(row.id)}
        rowActions={listRowActions}
        actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
        responsive="auto"
        cardsBelow="lg"
        selection={selectionConfig}
        virtualize
      />
    </div>
  );
}
