import type { TFunction } from "i18next";
import { Button, Icon, SearchInput, MobileActionsMenu } from "@/shared/components/ui";
import { ListFilter } from "@/shared/components/ui/ListFilter";
import type { MobileActionsMenuItem } from "@/shared/components/ui";
import { TablePageToolbar } from "@/shared/components/TablePageToolbar";
import { useViewport } from "@/shared/hooks/useViewport";

export interface FoldersToolbarProps {
  t: TFunction;
  foldersCountLabel: React.ReactNode;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  isSomeSelected?: boolean;
  selectedFolderIds?: number[];
  isBatchDeleting?: boolean;
  filter: {
    isFilterOpen: boolean;
    handleOpenFilter: () => void;
    handleCloseFilter: () => void;
    draftFilters: {
      department_id?: number | null;
      folder_type?: string | null;
      company_id?: number | null;
      from_date?: string;
      to_date?: string;
    };
    departmentOptions: Array<{ value: number | null; label: string }>;
    folderTypeOptions: Array<{ value: string | null; label: string }>;
    companyOptions: Array<{ value: number; label: string }>;
    handlePrimaryFilterChange: (v: number | null) => void;
    handleSecondaryFilterChange: (v: string | null) => void;
    handleTertiaryFilterChange: (v: number | null) => void;
    handleDateRangeModeChange: (mode: "after" | "upto" | "between") => void;
    handleDateRangeChange: (args: { fromDate: Date | null; toDate: Date | null }) => void;
    handleApplyFilter: () => void;
    handleClearFilter: () => void;
    handleCancelFilter: () => void;
    filterApplyDisabled: boolean;
    dateRangeFromDate: Date | null;
    dateRangeToDate: Date | null;
    dateRangeMode: "after" | "upto" | "between";
    hasAppliedDateFilter: boolean;
  };
  actions: {
    handleSearchDebounced: (q: string) => void;
    handleRefresh: () => void;
    handleOpenBatchDelete?: () => void;
    handleOpenCreateFolder?: () => void;
  };
  loading: boolean;
}

/** Toolbar: title, count, search, filter, view toggle, refresh. */
export function FoldersToolbar({
  t,
  foldersCountLabel,
  viewMode,
  setViewMode,
  isSomeSelected = false,
  selectedFolderIds = [],
  isBatchDeleting = false,
  filter,
  actions,
  loading,
}: FoldersToolbarProps) {
  const { isMobileView } = useViewport();
  const handleSetViewModeGrid = () => setViewMode("grid");
  const handleSetViewModeList = () => setViewMode("list");
  const handleGridViewKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setViewMode("grid");
    }
  };
  const handleListViewKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setViewMode("list");
    }
  };

  const listFilterJsx = (
    <ListFilter
      isOpen={filter.isFilterOpen}
      onClose={filter.handleCloseFilter}
      primaryFilter={{
        label: t("folders.department", { defaultValue: "Department" }),
        value: filter.draftFilters.department_id ?? null,
        options: filter.departmentOptions as Array<{ value: string | number; label: string }>,
        onChange: (v) => filter.handlePrimaryFilterChange(v != null ? Number(v) : null),
      }}
      secondaryFilter={{
        label: t("folders.folderType", { defaultValue: "Folder type" }),
        value: filter.draftFilters.folder_type ?? null,
        options: filter.folderTypeOptions as Array<{ value: string | number; label: string }>,
        onChange: (v) => filter.handleSecondaryFilterChange(v != null ? String(v) : null),
      }}
      tertiaryFilter={{
        label: t("folders.companyBrand", { defaultValue: "Company/Brand" }),
        value: filter.draftFilters.company_id ?? null,
        options: filter.companyOptions,
        onChange: (v) => filter.handleTertiaryFilterChange(v != null ? Number(v) : null),
      }}
      dateRange={{
        label: t("filter.byDate", { defaultValue: "By Date" }),
        mode: filter.dateRangeMode,
        fromDate: filter.dateRangeFromDate,
        toDate: filter.dateRangeToDate,
        onModeChange: filter.handleDateRangeModeChange,
        onDatesChange: filter.handleDateRangeChange,
        onCancel: filter.hasAppliedDateFilter ? filter.handleCancelFilter : undefined,
        cancelLabel: t("common.cancel", { defaultValue: "Cancel" }),
      }}
      onApply={filter.handleApplyFilter}
      onClear={filter.handleClearFilter}
      applyDisabled={filter.filterApplyDisabled}
      applyLabel={t("common.apply", { defaultValue: "Apply" })}
      clearLabel={t("common.clear", { defaultValue: "Clear" })}
      closeAriaLabel={t("common.close", { defaultValue: "Close filter" })}
      ariaLabel={t("folders.filterOptions", { defaultValue: "Filter options" })}
    />
  );

  const filterButtonJsx = (
    <div className="position-relative d-inline-block">
      <Button variant="outline" size="md" className="btn-outline-secondary d-inline-flex align-items-center" onClick={filter.handleOpenFilter} aria-label={t("folders.filter", { defaultValue: "Filter" })} aria-expanded={filter.isFilterOpen}>
        <Icon name="filter" className="me-1" />
        {t("folders.filter", { defaultValue: "Filter" })}
      </Button>
      {listFilterJsx}
    </div>
  );

  const viewToggleJsx = (
    <div className="folders__view-toggle" role="group" aria-label="Folders view toggle">
      <div className={`folders__view-toggle-slider ${viewMode === "list" ? "folders__view-toggle-slider--list" : ""}`} aria-hidden />
      <div
        role="button"
        tabIndex={0}
        className={`folders__view-option ${viewMode === "grid" ? "folders__view-option--active-grid" : ""}`}
        onClick={handleSetViewModeGrid}
        onKeyDown={handleGridViewKeyDown}
        aria-pressed={viewMode === "grid"}
        aria-label={t("folders.gridView", { defaultValue: "Grid view" })}
      >
        {t("folders.gridView", { defaultValue: "Grid view" })}
      </div>
      <div
        role="button"
        tabIndex={0}
        className={`folders__view-option ${viewMode === "list" ? "folders__view-option--active-list" : ""}`}
        onClick={handleSetViewModeList}
        onKeyDown={handleListViewKeyDown}
        aria-pressed={viewMode === "list"}
        aria-label={t("folders.listView", { defaultValue: "List view" })}
      >
        {t("folders.listView", { defaultValue: "List view" })}
      </div>
    </div>
  );

  const refreshButtonJsx = (
    <Button variant="outline" size="md" className="btn-outline-secondary d-inline-flex align-items-center" onClick={actions.handleRefresh} disabled={loading} aria-label={t("folders.refreshAria", { defaultValue: "Refresh folders" })}>
      <Icon name="refresh-cw" className="me-1" />
      {t("common.refresh", { defaultValue: "Refresh" })}
    </Button>
  );

  const searchInputJsx = (
    <SearchInput
      placeholder={t("folders.searchPlaceholder", { defaultValue: "Search folders..." })}
      debounceMs={300}
      onDebouncedChange={actions.handleSearchDebounced}
      icon="folder-search"
      wide
      highlight
      clearable
      clearAriaLabel={t("folders.clearSearchAria")}
      className={isMobileView ? "w-100" : "folders__search-wrap"}
      inputClassName="folders__search-input"
      aria-label={t("folders.searchAria", { defaultValue: "Search folders" })}
    />
  );

  const addFolderButtonJsx = actions.handleOpenCreateFolder ? (
    <Button
      variant="primary"
      size="md"
      className="d-inline-flex align-items-center"
      onClick={actions.handleOpenCreateFolder}
      aria-label={t("folders.addFolder", { defaultValue: "Add Folder" })}
    >
      <Icon name="folder-plus" className="me-1" />
      {t("folders.addFolder", { defaultValue: "Add Folder" })}
    </Button>
  ) : null;

  const batchDeleteButtonJsx = isSomeSelected && actions.handleOpenBatchDelete ? (
    <Button
      variant="outline"
      size="md"
      className="btn-outline-danger d-inline-flex align-items-center"
      onClick={actions.handleOpenBatchDelete}
      disabled={isBatchDeleting}
      aria-label={t("folders.deleteSelected", { defaultValue: "Delete selected" })}
    >
      <Icon name="trash-2" className="me-1" />
      {t("folders.deleteSelected", { defaultValue: "Delete selected" })}
      {selectedFolderIds.length > 0 && (
        <span className="badge bg-danger ms-2">{selectedFolderIds.length}</span>
      )}
    </Button>
  ) : null;

  if (isMobileView) {
    const mobileMenuItems: MobileActionsMenuItem[] = [
      {
        id: "grid",
        icon: "folder",
        label: t("folders.gridView", { defaultValue: "Grid view" }),
        onClick: handleSetViewModeGrid,
      },
      {
        id: "list",
        icon: "file-text",
        label: t("folders.listView", { defaultValue: "List view" }),
        onClick: handleSetViewModeList,
      },
      {
        id: "refresh",
        icon: "refresh-cw",
        label: t("common.refresh", { defaultValue: "Refresh" }),
        disabled: loading,
        onClick: actions.handleRefresh,
      },
    ];

    if (actions.handleOpenCreateFolder) {
      mobileMenuItems.unshift({
        id: "add-folder",
        icon: "folder-plus",
        label: t("folders.addFolder", { defaultValue: "Add Folder" }),
        onClick: actions.handleOpenCreateFolder,
      });
    }
    
    if (isSomeSelected && actions.handleOpenBatchDelete) {
      mobileMenuItems.push({
        id: "batch-delete",
        icon: "trash-2",
        label: t("folders.deleteSelected", { defaultValue: "Delete selected" }),
        badgeCount: selectedFolderIds.length,
        onClick: actions.handleOpenBatchDelete,
        disabled: isBatchDeleting,
        variant: "danger",
      });
    }
    
    return (
      <div className="card-header d-flex flex-column gap-2">
        <div className="d-flex align-items-center gap-2">
          <h5 className="card-title mb-0">{t("folders.title", { defaultValue: "Folders" })}</h5>
          {foldersCountLabel != null && <span className="text-muted fs-13">{foldersCountLabel}</span>}
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {filterButtonJsx}
          <MobileActionsMenu
            title={t("common.actions", { defaultValue: "Actions" })}
            items={mobileMenuItems}
            triggerAriaLabel={t("common.actions", { defaultValue: "Actions" })}
          />
        </div>
        <div className="w-100">{searchInputJsx}</div>
      </div>
    );
  }

  return (
    <TablePageToolbar
      title={<h5 className="card-title mb-0">{t("folders.title", { defaultValue: "Folders" })}</h5>}
      countSlot={foldersCountLabel}
      rightClassName="folders__header-actions"
    >
      {addFolderButtonJsx}
      {batchDeleteButtonJsx}
      {searchInputJsx}
      {filterButtonJsx}
      {viewToggleJsx}
      {refreshButtonJsx}
    </TablePageToolbar>
  );
}
