import React from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/core/common/collapse-header/collapse-header";
import { PageLayout } from "@/shared/layout/PageLayout";
import { useConfirmDialog } from "@/shared/hooks";
import { useFoldersPageContainer } from "@/features/folders/containers/useFoldersPageContainer";
import "@/features/folders/styles/folders.css";
import { FoldersToolbar } from "./FoldersToolbar";
import { FoldersContent } from "./FoldersContent";
import { FoldersModals } from "./FoldersModals";

/** Folders list page: layout, toolbar, content, delete/edit modals. */
const FoldersPage = () => {
  const { t } = useTranslation();
  const { data, loading, error, filter, actions, modals } = useFoldersPageContainer();
  const { routes, viewMode, setViewMode, folders, filteredFolders, foldersCountLabel, formatDate } = data;
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
