import { Link } from "react-router-dom";
import type { TFunction } from "i18next";
import { Button, Icon, SearchInput, ListFilter } from "@/shared/components/ui";
import { TablePageToolbar } from "@/shared/components/TablePageToolbar";

/** Props for the documents list toolbar (count, selection actions, search, filter, upload, trash link, refresh). */
export interface DocumentsToolbarProps {
  t: TFunction;
  loading: boolean;
  documents: unknown[];
  isSomeSelected: boolean;
  selectedDocumentIds: number[];
  filter: {
    handleSearchDebounced: (value: string) => void;
    handleOpenFilter: () => void;
    handleCloseFilter: () => void;
    draftFilters: { department_id?: number; document_type_id?: number; company_id?: number };
    departmentOptions: Array<{ value: number; label: string }>;
    documentTypeOptions: Array<{ value: number; label: string }>;
    companyOptions: Array<{ value: number; label: string }>;
    handlePrimaryFilterChange: (id: number | null) => void;
    handleSecondaryFilterChange: (id: number | null) => void;
    handleTertiaryFilterChange: (id: number | null) => void;
    handleApplyFilter: () => void;
    handleClearFilter: () => void;
    filterApplyDisabled: boolean;
    isFilterOpen: boolean;
  };
  actions: {
    handleOpenBatchMoveConfirm: () => void;
    handleOpenUpload: () => void;
    handleRefresh: () => void;
  };
  modals: {
    isMoveSubmitting: boolean;
    isTrashing: boolean;
    isArchiving: boolean;
  };
  batchArchiveDialog: { open: () => void };
  /** Called when user clicks "Move selected to trash"; may open batch trash confirm or show main-files block modal. */
  onMoveSelectedToTrashClick: () => void;
  routes: Record<string, string>;
}

/** Toolbar for documents list: count, bulk actions, search, filter, upload, trash link, refresh. */
export function DocumentsToolbar({
  t,
  loading,
  documents,
  isSomeSelected,
  selectedDocumentIds,
  filter,
  actions,
  modals,
  batchArchiveDialog,
  onMoveSelectedToTrashClick,
  routes,
}: DocumentsToolbarProps) {
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

  return (
    <TablePageToolbar
      title={<h5 className="card-title mb-0">{t("documents.title", { defaultValue: "Documents" })}</h5>}
      countSlot={countSlot}
      rightClassName="documents__header-actions"
    >
      {documents.length > 0 && isSomeSelected && (
        <>
          <Button
            variant="outline"
            size="md"
            className="btn-outline-secondary d-inline-flex align-items-center me-2"
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
          <Button
            variant="outline"
            size="md"
            className="btn-outline-secondary d-inline-flex align-items-center me-2"
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
          <Button
            variant="outline"
            size="md"
            className="btn-outline-danger d-inline-flex align-items-center me-2"
            onClick={onMoveSelectedToTrashClick}
            disabled={modals.isTrashing}
            aria-label={t("documents.moveSelectedToTrash", { defaultValue: "Move selected to trash" })}
          >
            <Icon name="trash-2" className="me-1" />
            {t("documents.moveSelectedToTrash", { defaultValue: "Move selected to trash" })}
            {selectedDocumentIds.length > 0 && (
              <span className="badge bg-danger ms-2">{selectedDocumentIds.length}</span>
            )}
          </Button>
        </>
      )}
      <SearchInput
        placeholder={t("documents.searchPlaceholder", { defaultValue: "Search documents..." })}
        debounceMs={300}
        onDebouncedChange={filter.handleSearchDebounced}
        icon="file-search-corner"
        wide
        highlight
        className="documents__search-wrap"
        inputClassName="documents__search-input"
        aria-label={t("documents.searchAria", { defaultValue: "Search documents" })}
      />
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
          onApply={filter.handleApplyFilter}
          onClear={filter.handleClearFilter}
          applyDisabled={filter.filterApplyDisabled}
          applyLabel={t("common.apply", { defaultValue: "Apply" })}
          clearLabel={t("common.clear", { defaultValue: "Clear" })}
          closeAriaLabel={t("common.close", { defaultValue: "Close filter" })}
          ariaLabel={t("documents.filterOptions", { defaultValue: "Filter options" })}
        />
      </div>
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
      {/* Trash link uses control-height-md to match toolbar Button height. */}
      <Link
        to={routes.documentsTrash}
        className="btn btn-outline-secondary control-height-md d-inline-flex align-items-center"
        aria-label={t("documents.trashViewAria", { defaultValue: "View trash" })}
      >
        <Icon name="trash" className="me-2" />
        {t("documents.trashView", { defaultValue: "Trash" })}
      </Link>
      <Button
        variant="outline"
        size="md"
        className="d-inline-flex align-items-center btn-outline-secondary"
        onClick={actions.handleRefresh}
        disabled={loading}
        aria-label={t("documents.refreshAria", { defaultValue: "Refresh documents" })}
      >
        <Icon name="refresh-cw" style={{ width: "1rem", height: "1rem" }} />
      </Button>
    </TablePageToolbar>
  );
}
