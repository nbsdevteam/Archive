import { useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { PageLayout } from "@/shared/layout/PageLayout";
import { useConfirmDialog } from "@/shared/hooks";
import { Alert, Button, DataTable, Icon, SearchInput, MobileActionsMenu } from "@/shared/components/ui";
import type { MobileActionsMenuItem } from "@/shared/components/ui";
import { TablePageToolbar } from "@/shared/components/TablePageToolbar";
import { ConfirmModal } from "@/shared/components/ui";
import { buildRowActions } from "@/shared/utils/buildRowActions";
import type { Company } from "@/shared/types/company";
import { useViewport } from "@/shared/hooks/useViewport";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsContext";
import { SHORTCUT_KEYS } from "@/shared/shortcuts/shortcutsRegistry";
import { useCompaniesPageContainer } from "../../containers/useCompaniesPageContainer";
import { getCompanyTableColumns } from "../../utils/companyTableColumns";
import { CreateCompanySidePanel } from "../../components/CreateCompanySidePanel";
import { EditCompanySidePanel } from "../../components/EditCompanySidePanel";
import { CompanyDetailsSidePanel } from "../../components/CompanyDetailsSidePanel";

/** Returns true if the event target is an editable field (input, textarea, contenteditable). */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  const role = target.getAttribute?.("role");
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable || role === "textbox") return true;
  return false;
}

/**
 * Companies list page: table with search, refresh, create (admin), row selection (admin),
 * batch delete / delete all + force follow-up, row actions (View, Edit, Delete).
 * Side panels for create/edit/details; confirm modals for single and batch deletes.
 * Keyboard: Ctrl+C = create company, R = refresh (when not in an input).
 */
export default function CompaniesPage() {
  const { t } = useTranslation();
  const { data, loading, error, actions, modals, isAdmin } = useCompaniesPageContainer();
  const { companies, countLabel, routes } = data;
  const {
    selectionConfig,
    isSomeSelected,
    selectedBatchCount,
    batchDeleteDialogProps,
    deleteAllDialogProps,
    forceDeleteDialogProps,
    pendingForceSkipCount,
  } = modals;

  const deleteDialog = useConfirmDialog<number>({ onConfirm: actions.confirmDelete });
  const { isDesktopView, isMobileView } = useViewport();
  const { registerHandler } = useShortcuts();

  useEffect(() => {
    if (!isDesktopView) return;
    registerHandler(SHORTCUT_KEYS.REFRESH_PAGE, () => actions.handleRefresh());
    return () => registerHandler(SHORTCUT_KEYS.REFRESH_PAGE, undefined);
  }, [isDesktopView, registerHandler, actions.handleRefresh]);

  useEffect(() => {
    if (!isDesktopView) return;
    if (isAdmin) {
      registerHandler(SHORTCUT_KEYS.CREATE_COMPANY, () => actions.handleOpenCreate());
      return () => registerHandler(SHORTCUT_KEYS.CREATE_COMPANY, undefined);
    }
    registerHandler(SHORTCUT_KEYS.CREATE_COMPANY, undefined);
  }, [isDesktopView, isAdmin, registerHandler, actions.handleOpenCreate]);

  /** Page shortcuts (Ctrl+C create, R refresh) when not in an input (single listener: no AbortController). */
  useEffect(() => {
    if (!isDesktopView) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const inInput = isEditableTarget(e.target);
      if (e.ctrlKey && e.key.toLowerCase() === "c") {
        if (isAdmin && !inInput) {
          e.preventDefault();
          actions.handleOpenCreate();
        }
        return;
      }
      if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!inInput) {
          e.preventDefault();
          actions.handleRefresh();
        }
      }
    };
    const opts = { capture: true };
    window.addEventListener("keydown", handleKeyDown, opts);
    return () => window.removeEventListener("keydown", handleKeyDown, opts);
  }, [isDesktopView, isAdmin, actions.handleOpenCreate, actions.handleRefresh]);

  const columns = useMemo(
    () => getCompanyTableColumns({ t }),
    [t]
  );

  const batchDeleteSelectedJsx = useMemo(() => {
    if (!isAdmin || !isSomeSelected) return null;
    return (
      <Button
        variant="outline"
        size="md"
        className="btn-outline-danger d-inline-flex align-items-center"
        onClick={actions.openBatchDeleteDialog}
        disabled={loading}
        aria-label={t("companies.deleteSelected", { defaultValue: "Delete selected" })}
      >
        <Icon name="trash-2" className="me-1" />
        {t("companies.deleteSelected", { defaultValue: "Delete selected" })}
        {selectedBatchCount > 0 && <span className="badge bg-danger ms-2">{selectedBatchCount}</span>}
      </Button>
    );
  }, [isAdmin, isSomeSelected, loading, actions.openBatchDeleteDialog, selectedBatchCount, t]);

  const deleteAllJsx = useMemo(() => {
    if (!isAdmin) return null;
    return (
      <Button
        variant="outline"
        size="md"
        className="btn-outline-danger d-inline-flex align-items-center"
        onClick={actions.openDeleteAllDialog}
        disabled={loading}
        aria-label={t("companies.deleteAll", { defaultValue: "Delete all" })}
      >
        <Icon name="trash-2" className="me-1" />
        {t("companies.deleteAll", { defaultValue: "Delete all" })}
      </Button>
    );
  }, [isAdmin, loading, actions.openDeleteAllDialog, t]);

  /** Admin-only mobile entries mirroring desktop batch delete + delete all. */
  const buildMobileBatchItems = useCallback((): MobileActionsMenuItem[] => {
    const out: MobileActionsMenuItem[] = [];
    if (!isAdmin) return out;
    if (isSomeSelected) {
      out.push({
        id: "batch-delete",
        icon: "trash-2",
        label: t("companies.deleteSelected", { defaultValue: "Delete selected" }),
        badgeCount: selectedBatchCount,
        variant: "danger",
        onClick: actions.openBatchDeleteDialog,
        disabled: loading,
      });
    }
    out.push({
      id: "delete-all",
      icon: "trash-2",
      label: t("companies.deleteAll", { defaultValue: "Delete all" }),
      variant: "danger",
      onClick: actions.openDeleteAllDialog,
      disabled: loading,
    });
    return out;
  }, [isAdmin, isSomeSelected, selectedBatchCount, loading, actions.openBatchDeleteDialog, actions.openDeleteAllDialog, t]);

  const rowActions = useMemo(
    () =>
      buildRowActions<Company>(t, [
        {
          id: "view",
          labelKey: "common.view",
          defaultValue: "View",
          variant: "light",
          onClick: (row) => actions.handleOpenDetails(row.id),
        },
        {
          id: "edit",
          labelKey: "common.edit",
          defaultValue: "Edit",
          icon: "pencil",
          variant: "outline",
          className: "btn-outline-secondary me-1",
          visible: () => isAdmin,
          onClick: (row) => actions.handleOpenEdit(row.id),
        },
        {
          id: "delete",
          labelKey: "common.delete",
          defaultValue: "Delete",
          icon: "trash-2",
          variant: "outline",
          className: "btn-outline-danger",
          visible: () => isAdmin,
          onClick: (row) => deleteDialog.open(row.id),
        },
      ]),
    [t, isAdmin, actions.handleOpenDetails, actions.handleOpenEdit, deleteDialog.open]
  );

  return (
    <PageLayout
      title={t("companies.title", { defaultValue: "Companies" })}
      breadcrumbItems={[]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
      <div className="card companies__table-card">
        {isMobileView ? (
          <div className="card-header d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="card-title mb-0">{t("companies.title", { defaultValue: "Companies" })}</h5>
              {countLabel != null && <span className="text-muted fs-13">{countLabel}</span>}
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <MobileActionsMenu
                title={t("common.actions", { defaultValue: "Actions" })}
                items={(() => {
                  const items: MobileActionsMenuItem[] = [
                    {
                      id: "refresh",
                      icon: "refresh-cw",
                      label: t("common.refresh", { defaultValue: "Refresh" }),
                      disabled: loading,
                      onClick: actions.handleRefresh,
                    },
                  ];
                  if (isAdmin) {
                    items.push({
                      id: "create",
                      icon: "file-up",
                      label: t("companies.createCompany", { defaultValue: "Create company" }),
                      onClick: actions.handleOpenCreate,
                    });
                    items.push(...buildMobileBatchItems());
                  }
                  return items;
                })()}
                triggerAriaLabel={t("common.actions", { defaultValue: "Actions" })}
              />
            </div>
            <div className="w-100">
              <SearchInput
                placeholder={t("companies.searchPlaceholder", { defaultValue: "Search companies..." })}
                debounceMs={300}
                onDebouncedChange={actions.handleSearchDebounced}
                icon="search"
                wide
                highlight
                clearable
                clearAriaLabel={t("companies.clearSearchAria")}
                className="w-100"
                aria-label={t("companies.searchPlaceholder", { defaultValue: "Search companies" })}
              />
            </div>
          </div>
        ) : (
          <TablePageToolbar
            title={<h5 className="card-title mb-0">{t("companies.title", { defaultValue: "Companies" })}</h5>}
            countSlot={countLabel}
            rightClassName="companies__header-actions"
          >
            {batchDeleteSelectedJsx}
            {deleteAllJsx}
            <SearchInput
              placeholder={t("companies.searchPlaceholder", { defaultValue: "Search companies..." })}
              debounceMs={300}
              onDebouncedChange={actions.handleSearchDebounced}
              icon="search"
              wide
              highlight
              clearable
              clearAriaLabel={t("companies.clearSearchAria")}
              className="companies__search-wrap"
              aria-label={t("companies.searchPlaceholder", { defaultValue: "Search companies" })}
            />
            <Button
              variant="outline"
              size="md"
              className="btn-outline-secondary d-inline-flex align-items-center"
              onClick={actions.handleRefresh}
              disabled={loading}
              aria-label={t("common.refresh", { defaultValue: "Refresh" })}
            >
              <Icon name="refresh-cw" className="me-1" />
              {t("common.refresh", { defaultValue: "Refresh" })}
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                size="md"
                className="d-inline-flex align-items-center"
                onClick={actions.handleOpenCreate}
                aria-label={t("companies.createCompany", { defaultValue: "Create company" })}
              >
                <Icon name="file-up" className="me-1" />
                {t("companies.createCompany", { defaultValue: "Create company" })}
              </Button>
            )}
          </TablePageToolbar>
        )}
        <div className="card-body h-min-50vh">
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
              <Button
                variant="outline"
                size="sm"
                className="btn-outline-secondary ms-2"
                onClick={actions.handleRefresh}
              >
                {t("common.retry", { defaultValue: "Retry" })}
              </Button>
            </Alert>
          )}
          <DataTable<Company>
            data={companies}
            getRowId={(row) => row.id}
            columns={columns}
            loading={loading}
            emptyMessage={t("companies.noCompaniesFound", { defaultValue: "No companies found" })}
            rowActions={rowActions}
            actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
            selection={isAdmin ? selectionConfig : undefined}
          />
        </div>
      </div>

      <ConfirmModal
        {...deleteDialog.modalProps}
        title={t("companies.deleteCompany", { defaultValue: "Delete company" })}
        message={t("companies.confirmDelete", { defaultValue: "Are you sure you want to delete this company?" })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...batchDeleteDialogProps}
        title={t("companies.batchDeleteTitle", { defaultValue: "Delete selected companies" })}
        message={t("companies.batchDeleteMessage", {
          defaultValue:
            "Delete {{count}} selected companies? Companies with active folders will be skipped unless you confirm force delete in the next step.",
          count: selectedBatchCount,
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...deleteAllDialogProps}
        title={t("companies.deleteAllTitle", { defaultValue: "Delete all companies" })}
        message={t("companies.deleteAllMessage", {
          defaultValue: "Remove every company that has no active folders. Companies with folders will be skipped unless you force delete next.",
        })}
        confirmLabel={t("companies.deleteAllConfirm", { defaultValue: "Delete all" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...forceDeleteDialogProps}
        title={t("companies.forceDeleteTitle", { defaultValue: "Force delete skipped companies" })}
        message={t("companies.forceDeleteMessage", {
          defaultValue:
            "{{count}} companies with active folders were skipped. Force delete them (removes their folders too)?",
          count: pendingForceSkipCount,
        })}
        confirmLabel={t("companies.forceDeleteConfirm", { defaultValue: "Force delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <CreateCompanySidePanel
        isOpen={modals.isCreateOpen}
        onClose={actions.handleCloseCreate}
        onSuccess={actions.handleCreateSuccess}
      />
      <EditCompanySidePanel
        isOpen={modals.editCompanyId != null}
        companyId={modals.editCompanyId}
        onClose={actions.handleCloseEdit}
        onSuccess={actions.handleEditSuccess}
      />
      <CompanyDetailsSidePanel
        isOpen={modals.detailsCompanyId != null}
        companyId={modals.detailsCompanyId}
        onClose={actions.handleCloseDetails}
      />
    </PageLayout>
  );
}
