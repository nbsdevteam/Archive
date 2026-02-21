import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { PageLayout } from "@/shared/layout/PageLayout";
import { useConfirmDialog } from "@/shared/hooks";
import { Alert, Button, DataTable, Icon, SearchInput } from "@/shared/components/ui";
import { TablePageToolbar } from "@/shared/components/TablePageToolbar";
import { ConfirmModal } from "@/shared/components/ui";
import { buildRowActions } from "@/shared/utils/buildRowActions";
import type { Company } from "@/shared/types/company";
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
 * Companies list page: table with search, refresh, create (admin), row actions
 * (View details, Edit, Delete). Uses side panels for create/edit/details and
 * confirm modal for delete. Keyboard: Ctrl+C = create company, R = refresh (when not in an input).
 */
export default function CompaniesPage() {
  const { t } = useTranslation();
  const { data, loading, error, actions, modals, isAdmin } = useCompaniesPageContainer();
  const { companies, countLabel, routes } = data;

  const deleteDialog = useConfirmDialog<number>({ onConfirm: actions.confirmDelete });
  const { registerHandler } = useShortcuts();

  /** Register with global shortcut context so Alt overlay shows and Alt+R / Alt+C work. */
  useEffect(() => {
    registerHandler(SHORTCUT_KEYS.REFRESH_PAGE, () => actions.handleRefresh());
    return () => registerHandler(SHORTCUT_KEYS.REFRESH_PAGE, undefined);
  }, [registerHandler, actions.handleRefresh]);

  useEffect(() => {
    if (isAdmin) {
      registerHandler(SHORTCUT_KEYS.CREATE_COMPANY, () => actions.handleOpenCreate());
      return () => registerHandler(SHORTCUT_KEYS.CREATE_COMPANY, undefined);
    }
    registerHandler(SHORTCUT_KEYS.CREATE_COMPANY, undefined);
  }, [isAdmin, registerHandler, actions.handleOpenCreate]);

  /** Local keydown: Ctrl+C = create company, R = refresh (ignored when focus is in an input). */
  useEffect(() => {
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
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isAdmin, actions.handleOpenCreate, actions.handleRefresh]);

  const columns = useMemo(
    () => getCompanyTableColumns({ t }),
    [t]
  );

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
        <TablePageToolbar
          title={<h5 className="card-title mb-0">{t("companies.title", { defaultValue: "Companies" })}</h5>}
          countSlot={countLabel}
        >
          <SearchInput
            placeholder={t("companies.searchPlaceholder", { defaultValue: "Search companies..." })}
            debounceMs={300}
            onDebouncedChange={actions.handleSearchDebounced}
            icon="search"
            wide
            highlight
            aria-label={t("companies.searchPlaceholder", { defaultValue: "Search companies" })}
          />
          <Button
            variant="outline"
            size="md"
            className="btn-outline-secondary"
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
              onClick={actions.handleOpenCreate}
              aria-label={t("companies.createCompany", { defaultValue: "Create company" })}
            >
              <Icon name="file-up" className="me-1" />
              {t("companies.createCompany", { defaultValue: "Create company" })}
            </Button>
          )}
        </TablePageToolbar>
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
