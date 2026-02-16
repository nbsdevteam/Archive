import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/core/common/collapse-header/collapse-header";
import { PageLayout } from "@/shared/layout/PageLayout";
import { useConfirmDialog } from "@/shared/hooks";
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
  const { registerHandler } = useShortcuts();
  const { data, loading, error, filter, actions, modals } = useFoldersPageContainer();

  useEffect(() => {
    registerHandler(SHORTCUT_KEYS.REFRESH_PAGE, () => actions.handleRefresh());
    return () => registerHandler(SHORTCUT_KEYS.REFRESH_PAGE, undefined);
  }, [registerHandler, actions.handleRefresh]);

  useEffect(() => {
    registerHandler(SHORTCUT_KEYS.OPEN_FILTER, () => filter.handleOpenFilter());
    return () => registerHandler(SHORTCUT_KEYS.OPEN_FILTER, undefined);
  }, [registerHandler, filter.handleOpenFilter]);
  const { routes, viewMode, setViewMode, filteredFolders, foldersCountLabel, formatDate } = data;
  const deleteFolderDialog = useConfirmDialog<number>({ onConfirm: actions.confirmDeleteFolder });

  return (
    <PageLayout title={t("folders.title", { defaultValue: "Folders" })} breadcrumbItems={[]} homeTo={routes.adminDashboard} rightContent={<CollapseHeader />}>
      <div className="card folders__table-card">
        <FoldersToolbar
          t={t}
          foldersCountLabel={foldersCountLabel}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filter={{
            isFilterOpen: filter.isFilterOpen,
            handleOpenFilter: filter.handleOpenFilter,
            handleCloseFilter: filter.handleCloseFilter,
            draftFilters: filter.draftFilters,
            departmentOptions: filter.departmentOptions,
            folderTypeOptions: filter.folderTypeOptions,
            handlePrimaryFilterChange: filter.handlePrimaryFilterChange,
            handleSecondaryFilterChange: filter.handleSecondaryFilterChange,
            handleApplyFilter: filter.handleApplyFilter,
            handleClearFilter: filter.handleClearFilter,
            filterApplyDisabled: filter.filterApplyDisabled,
          }}
          actions={{ handleSearchDebounced: actions.handleSearchDebounced, handleRefresh: actions.handleRefresh }}
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
          actions={{
            handleRefresh: actions.handleRefresh,
            handleNavigateToFolder: actions.handleNavigateToFolder,
            handleGridKeyDown: (id, e) => actions.handleGridKeyDown(id, e as React.KeyboardEvent<HTMLDivElement>),
            handleOpenEditFolder: actions.handleOpenEditFolder,
            getFolderStatusBadgeVariant: actions.getFolderStatusBadgeVariant,
          }}
          onDeleteClick={(id) => deleteFolderDialog.open(id)}
        />
      </div>
      <FoldersModals
        t={t}
        deleteFolderDialog={deleteFolderDialog}
        isEditOpen={modals.editingFolder != null}
        editingFolder={modals.editingFolder}
        onCloseEdit={actions.handleCloseEditFolder}
        onEditSuccess={actions.handleEditFolderSuccess}
      />
    </PageLayout>
  );
};

export default FoldersPage;
