import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { PageLayout } from "@/shared/layout/PageLayout";
import { PaginationSection } from "@/shared/components/PaginationSection";
import { useConfirmDialog, useConfirmDialogEmpty } from "@/shared/hooks";
import { useViewport } from "@/shared/hooks/useViewport";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsContext";
import { SHORTCUT_KEYS } from "@/shared/shortcuts/shortcutsRegistry";
import { useFoldersPageContainer } from "@/features/folders/containers/useFoldersPageContainer";
import "@/features/folders/styles/folders.css";
import { FoldersToolbar } from "./FoldersToolbar";
import { FoldersContent } from "./FoldersContent";
import { FoldersModals } from "./FoldersModals";

/** Folders list page: layout, toolbar, content, delete/edit modals. Registers refresh (Alt+R) and filter (Alt+F) shortcuts. */
const FoldersPage = () => {
  const { t } = useTranslation();
  const { isDesktopView } = useViewport();
  const { registerHandler } = useShortcuts();
  const { data, loading, error, filter, paging, selection, actions, modals } =
    useFoldersPageContainer();

  const deleteFolderDialog = useConfirmDialog<number>({
    onConfirm: actions.confirmDeleteFolder,
  });

  const batchDeleteDialog = useConfirmDialogEmpty({
    onConfirm: actions.confirmBatchDeleteFolders,
  });

  useEffect(() => {
    if (!isDesktopView) return;
    registerHandler(SHORTCUT_KEYS.REFRESH_PAGE, () => actions.handleRefresh());
    return () => registerHandler(SHORTCUT_KEYS.REFRESH_PAGE, undefined);
  }, [isDesktopView, registerHandler, actions.handleRefresh]);

  useEffect(() => {
    if (!isDesktopView) return;
    registerHandler(SHORTCUT_KEYS.OPEN_FILTER, () => filter.handleOpenFilter());
    return () => registerHandler(SHORTCUT_KEYS.OPEN_FILTER, undefined);
  }, [isDesktopView, registerHandler, filter.handleOpenFilter]);

  const {
    routes,
    viewMode,
    setViewMode,
    filteredFolders,
    foldersCountLabel,
    formatDate,
  } = data;

  return (
    <PageLayout
      title={t("folders.title", { defaultValue: "Folders" })}
      breadcrumbItems={[]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
      <div className="card folders__table-card">
        <FoldersToolbar
          t={t}
          foldersCountLabel={foldersCountLabel}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isSomeSelected={selection.isSomeSelected}
          selectedFolderIds={selection.selectedFolderIds}
          isBatchDeleting={selection.isBatchDeleting}
          filter={{
            isFilterOpen: filter.isFilterOpen,
            handleOpenFilter: filter.handleOpenFilter,
            handleCloseFilter: filter.handleCloseFilter,
            draftFilters: filter.draftFilters,
            departmentOptions: filter.departmentOptions,
            folderTypeOptions: filter.folderTypeOptions,
            companyOptions: filter.companyOptions,
            handlePrimaryFilterChange: filter.handlePrimaryFilterChange,
            handleSecondaryFilterChange: filter.handleSecondaryFilterChange,
            handleTertiaryFilterChange: filter.handleTertiaryFilterChange,
            handleDateRangeModeChange: filter.handleDateRangeModeChange,
            handleDateRangeChange: filter.handleDateRangeChange,
            handleApplyFilter: filter.handleApplyFilter,
            handleClearFilter: filter.handleClearFilter,
            handleCancelFilter: filter.handleCancelFilter,
            filterApplyDisabled: filter.filterApplyDisabled,
            dateRangeFromDate: filter.dateRangeFromDate,
            dateRangeToDate: filter.dateRangeToDate,
            dateRangeMode: filter.dateRangeMode,
            hasAppliedDateFilter: filter.hasAppliedDateFilter,
          }}
          actions={{
            handleSearchDebounced: actions.handleSearchDebounced,
            handleRefresh: actions.handleRefresh,
            handleOpenBatchDelete: batchDeleteDialog.open,
            handleOpenCreateFolder: actions.handleOpenCreateFolder,
          }}
          loading={loading}
        />
        <FoldersContent
          t={t}
          routes={routes}
          filteredFolders={filteredFolders}
          viewMode={viewMode}
          loading={loading}
          error={error}
          formatDate={formatDate}
          selectionConfig={viewMode === "list" ? selection.selectionConfig : undefined}
          actions={{
            handleRefresh: actions.handleRefresh,
            handleNavigateToFolder: actions.handleNavigateToFolder,
            handleGridKeyDown: (id, e) =>
              actions.handleGridKeyDown(
                id,
                e as React.KeyboardEvent<HTMLDivElement>,
              ),
            handleOpenEditFolder: actions.handleOpenEditFolder,
            getFolderStatusBadgeVariant: actions.getFolderStatusBadgeVariant,
          }}
          onDeleteClick={(id) => deleteFolderDialog.open(id)}
        />
        {paging.pagination &&
          (paging.pagination.total_pages > 0 ||
            (paging.pagination.total ?? 0) > 0) && (
            <PaginationSection
              page={paging.pagination.page ?? 1}
              perPage={paging.pagination.per_page ?? 20}
              total={paging.pagination.total}
              totalPages={paging.pagination.total_pages}
              onPageChange={paging.handlePageChange}
              onPerPageChange={paging.handlePerPageChange}
              disabled={loading}
            />
          )}
      </div>
      <FoldersModals
        t={t}
        deleteFolderDialog={deleteFolderDialog}
        batchDeleteDialog={batchDeleteDialog}
        selectedFolderIds={selection.selectedFolderIds}
        isEditOpen={modals.editingFolder != null}
        editingFolder={modals.editingFolder}
        onCloseEdit={actions.handleCloseEditFolder}
        onEditSuccess={actions.handleEditFolderSuccess}
        isCreateOpen={modals.isCreateFolderOpen}
        onCloseCreate={actions.handleCloseCreateFolder}
        onCreateSuccess={actions.handleCreateFolderSuccess}
      />
    </PageLayout>
  );
};

export default FoldersPage;
