import type { TFunction } from "i18next";
import { Button, Icon, SearchInput, MobileActionsMenu } from "@/shared/components/ui";
import { ListFilter } from "@/shared/components/ui/ListFilter";
import type { MobileActionsMenuItem } from "@/shared/components/ui";
import { TablePageToolbar } from "@/shared/components/TablePageToolbar";
import { useViewport } from "@/shared/hooks/useViewport";
import type { DocumentBatchActionsResult } from "@/shared/services/documentBatchActionsService";

/** Props for the documents list toolbar (count, selection actions, search, filter, upload, refresh). */
export interface DocumentsToolbarProps {
  t: TFunction;
  loading: boolean;
  documents: unknown[];
  isSomeSelected: boolean;
  selectedDocumentIds: number[];
  /** Which batch actions are allowed for the current selection (common-only, from shared service). */
  batchActions: DocumentBatchActionsResult;
  filter: {
    handleSearchDebounced: (value: string) => void;
    handleOpenFilter: () => void;
    handleCloseFilter: () => void;
    draftFilters: {
      department_id?: number;
      document_type_id?: number;
      company_id?: number;
      from_date?: string;
      to_date?: string;
    };
    departmentOptions: Array<{ value: number; label: string }>;
    documentTypeOptions: Array<{ value: number; label: string }>;
    companyOptions: Array<{ value: number; label: string }>;
    handlePrimaryFilterChange: (id: number | null) => void;
    handleSecondaryFilterChange: (id: number | null) => void;
    handleTertiaryFilterChange: (id: number | null) => void;
    handleDateRangeModeChange: (mode: "after" | "upto" | "between") => void;
    handleDateRangeChange: (args: { fromDate: Date | null; toDate: Date | null }) => void;
    handleApplyFilter: () => void;
    handleClearFilter: () => void;
    handleCancelFilter: () => void;
    filterApplyDisabled: boolean;
    isFilterOpen: boolean;
    dateRangeFromDate: Date | null;
    dateRangeToDate: Date | null;
    dateRangeMode: "after" | "upto" | "between";
    hasAppliedDateFilter: boolean;
  };
  actions: {
    handleOpenBatchMoveConfirm: () => void;
    handleOpenUpload: () => void;
    handleRefresh: () => void;
    handleOpenReport: () => void;
  };
  modals: {
    isMoveSubmitting: boolean;
    isTrashing: boolean;
    isArchiving: boolean;
    isRestoring: boolean;
    isUnarchiving: boolean;
  };
  batchArchiveDialog: { open: () => void };
  batchRestoreDialog: { open: () => void };
  batchUnarchiveDialog: { open: () => void };
}

/** Toolbar for documents list: count, bulk actions, search, filter, upload, refresh. */
export function DocumentsToolbar({
  t,
  loading,
  documents,
  isSomeSelected,
  selectedDocumentIds,
  batchActions,
  filter,
  actions,
  modals,
  batchArchiveDialog,
  batchRestoreDialog,
  batchUnarchiveDialog,
}: DocumentsToolbarProps) {
  const { isMobileView } = useViewport();
  const countSlot =
    loading
      ? t("common.loading", { defaultValue: "Loading..." })
      : (documents?.length != null && (
          <>
            <span className="Num">{documents.length}</span>{" "}
            {documents.length === 1
              ? t("documents.document", { defaultValue: "document" })
              : t("documents.documents", { defaultValue: "documents" })}
          </>
        )) || null;

  const listFilterJsx = (
    <ListFilter
      isOpen={filter.isFilterOpen}
      onClose={filter.handleCloseFilter}
      primaryFilter={{
        label: t("documents.department", { defaultValue: "Department" }),
        value: filter.draftFilters.department_id ?? null,
        options: filter.departmentOptions,
        onChange: (value) => filter.handlePrimaryFilterChange(value != null ? Number(value) : null),
      }}
      secondaryFilter={{
        label: t("documents.documentType", { defaultValue: "Document type" }),
        value: filter.draftFilters.document_type_id ?? null,
        options: filter.documentTypeOptions,
        onChange: (value) => filter.handleSecondaryFilterChange(value != null ? Number(value) : null),
      }}
      tertiaryFilter={{
        label: t("documents.companyBrand", { defaultValue: "Company/Brand" }),
        value: filter.draftFilters.company_id ?? null,
        options: filter.companyOptions,
        onChange: (value) => filter.handleTertiaryFilterChange(value != null ? Number(value) : null),
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
      ariaLabel={t("documents.filterOptions", { defaultValue: "Filter options" })}
    />
  );

  const batchButtonsJsx =
    documents.length > 0 && isSomeSelected ? (
      <>
        {batchActions.canBatchRestore && (
          <Button
            variant="outline"
            size="md"
            className="btn-outline-success d-inline-flex align-items-center"
            onClick={batchRestoreDialog.open}
            disabled={modals.isRestoring}
            aria-label={t("documents.restoreSelected", { defaultValue: "Restore selected" })}
          >
            <Icon name="refresh-cw" className="me-1" />
            {t("documents.restoreSelected", { defaultValue: "Restore selected" })}
            {selectedDocumentIds.length > 0 && (
              <span className="badge bg-success ms-2">{selectedDocumentIds.length}</span>
            )}
          </Button>
        )}
        {batchActions.canBatchUnarchive && (
          <Button
            variant="outline"
            size="md"
            className="btn-outline-secondary d-inline-flex align-items-center"
            onClick={batchUnarchiveDialog.open}
            disabled={modals.isUnarchiving}
            aria-label={t("documents.unarchiveSelected", { defaultValue: "Unarchive selected" })}
          >
            <Icon name="archive" className="me-1" />
            {t("documents.unarchiveSelected", { defaultValue: "Unarchive selected" })}
            {selectedDocumentIds.length > 0 && (
              <span className="badge bg-secondary ms-2">{selectedDocumentIds.length}</span>
            )}
          </Button>
        )}
        {batchActions.canBatchTransfer && (
          <Button
            variant="outline"
            size="md"
            className="btn-outline-secondary d-inline-flex align-items-center"
            onClick={actions.handleOpenBatchMoveConfirm}
            disabled={modals.isMoveSubmitting || modals.isTrashing || modals.isArchiving}
            aria-label={t("documents.transferSelected", { defaultValue: "Transfer selected" })}
          >
            <Icon name="arrow-right-left" className="me-1" />
            {t("documents.transferSelected", { defaultValue: "Transfer selected" })}
            {selectedDocumentIds.length > 0 && (
              <span className="badge bg-secondary ms-2">{selectedDocumentIds.length}</span>
            )}
          </Button>
        )}
        {batchActions.canBatchArchive && (
          <Button
            variant="outline"
            size="md"
            className="btn-outline-secondary d-inline-flex align-items-center"
            onClick={batchArchiveDialog.open}
            disabled={modals.isArchiving}
            aria-label={t("documents.archiveSelected", { defaultValue: "Archive selected" })}
          >
            <Icon name="archive" className="me-1" />
            {t("documents.archiveSelected", { defaultValue: "Archive selected" })}
            {selectedDocumentIds.length > 0 && (
              <span className="badge bg-secondary ms-2">{selectedDocumentIds.length}</span>
            )}
          </Button>
        )}
      </>
    ) : null;

  const filterButtonJsx = (
    <div className="position-relative d-inline-block">
      <Button
        variant="outline"
        size="md"
        className="d-inline-flex align-items-center btn-outline-secondary"
        onClick={filter.handleOpenFilter}
        aria-label={t("documents.filter", { defaultValue: "Filter" })}
        aria-expanded={filter.isFilterOpen}
      >
        <Icon name="filter" className="me-1" />
        {t("documents.filter", { defaultValue: "Filter" })}
      </Button>
      {listFilterJsx}
    </div>
  );

  const refreshButtonJsx = (
    <Button
      variant="outline"
      size="md"
      className="d-inline-flex align-items-center btn-outline-secondary"
      onClick={actions.handleRefresh}
      disabled={loading}
      aria-label={t("documents.refreshAria", { defaultValue: "Refresh documents" })}
    >
      <Icon name="refresh-cw" className="me-1" />
      {t("common.refresh", { defaultValue: "Refresh" })}
    </Button>
  );

  if (isMobileView) {
    const mobileMenuItems: MobileActionsMenuItem[] = [
      {
        id: "fetch-report",
        icon: "bar-chart-2",
        label: t("documents.fetchReport", { defaultValue: "Fetch Uploaded Documents" }),
        onClick: actions.handleOpenReport,
      },
      {
        id: "upload",
        icon: "file-up",
        label: t("documents.uploadDocuments", { defaultValue: "Upload Documents" }),
        onClick: actions.handleOpenUpload,
      },
      {
        id: "refresh",
        icon: "refresh-cw",
        label: t("common.refresh", { defaultValue: "Refresh" }),
        disabled: loading,
        onClick: actions.handleRefresh,
      },
    ];
    if (documents.length > 0 && isSomeSelected) {
      if (batchActions.canBatchRestore) {
        mobileMenuItems.push({
          id: "restore",
          icon: "refresh-cw",
          label: t("documents.restoreSelected", { defaultValue: "Restore selected" }),
          badgeCount: selectedDocumentIds.length,
          onClick: batchRestoreDialog.open,
          disabled: modals.isRestoring,
        });
      }
      if (batchActions.canBatchUnarchive) {
        mobileMenuItems.push({
          id: "unarchive",
          icon: "archive",
          label: t("documents.unarchiveSelected", { defaultValue: "Unarchive selected" }),
          badgeCount: selectedDocumentIds.length,
          onClick: batchUnarchiveDialog.open,
          disabled: modals.isUnarchiving,
        });
      }
      if (batchActions.canBatchTransfer) {
        mobileMenuItems.push({
          id: "transfer",
          icon: "arrow-right-left",
          label: t("documents.transferSelected", { defaultValue: "Transfer selected" }),
          badgeCount: selectedDocumentIds.length,
          onClick: actions.handleOpenBatchMoveConfirm,
          disabled: modals.isMoveSubmitting || modals.isTrashing || modals.isArchiving,
        });
      }
      if (batchActions.canBatchArchive) {
        mobileMenuItems.push({
          id: "archive",
          icon: "archive",
          label: t("documents.archiveSelected", { defaultValue: "Archive selected" }),
          badgeCount: selectedDocumentIds.length,
          onClick: batchArchiveDialog.open,
          disabled: modals.isArchiving,
        });
      }
    }
    return (
      <div className="card-header d-flex flex-column gap-2">
        <div className="d-flex align-items-center gap-2">
          <h5 className="card-title mb-0">{t("documents.title", { defaultValue: "Documents" })}</h5>
          {countSlot != null && <span className="text-muted fs-13">{countSlot}</span>}
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {filterButtonJsx}
          <MobileActionsMenu
            title={t("common.actions", { defaultValue: "Actions" })}
            items={mobileMenuItems}
            triggerAriaLabel={t("documents.actionsAria", { defaultValue: "Actions" })}
          />
        </div>
        <div className="w-100">
          <SearchInput
            placeholder={t("documents.searchPlaceholder", { defaultValue: "Search documents..." })}
            debounceMs={300}
            onDebouncedChange={filter.handleSearchDebounced}
            icon="file-search-corner"
            wide
            highlight
            clearable
            clearAriaLabel={t("documents.clearSearchAria")}
            className="w-100"
            inputClassName="documents__search-input"
            aria-label={t("documents.searchAria", { defaultValue: "Search documents" })}
          />
        </div>
      </div>
    );
  }

  return (
    <TablePageToolbar
      title={<h5 className="card-title mb-0">{t("documents.title", { defaultValue: "Documents" })}</h5>}
      countSlot={countSlot}
      rightClassName="documents__header-actions"
    >
      {batchButtonsJsx}
      <SearchInput
        placeholder={t("documents.searchPlaceholder", { defaultValue: "Search documents..." })}
        debounceMs={300}
        onDebouncedChange={filter.handleSearchDebounced}
        icon="file-search-corner"
        wide
        highlight
        clearable
        clearAriaLabel={t("documents.clearSearchAria")}
        className="documents__search-wrap"
        inputClassName="documents__search-input"
        aria-label={t("documents.searchAria", { defaultValue: "Search documents" })}
      />
      {filterButtonJsx}
      <Button
        variant="outline"
        size="md"
        className="d-inline-flex align-items-center btn-outline-theme"
        onClick={actions.handleOpenReport}
        aria-label={t("documents.fetchReportAria", { defaultValue: "Fetch uploaded documents report" })}
      >
        <Icon name="bar-chart-2" className="me-2" />
        {t("documents.fetchReport", { defaultValue: "Fetch Uploaded Documents" })}
      </Button>
      <Button
        variant="outline"
        size="md"
        className="d-inline-flex align-items-center btn-outline-secondary"
        onClick={actions.handleOpenUpload}
        data-testid="upload-documents-btn"
        aria-label={t("documents.uploadDocumentsAria", { defaultValue: "Upload documents" })}
      >
        <Icon name="file-up" className="me-2" />
        {t("documents.uploadDocuments", { defaultValue: "Upload Documents" })}
      </Button>
      {refreshButtonJsx}
    </TablePageToolbar>
  );
}
