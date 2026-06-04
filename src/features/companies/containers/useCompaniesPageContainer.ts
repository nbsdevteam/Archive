import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { all_routes } from "@/router/all_routes";
import { getIsManager } from "@/shared/constants/access";
import { useAuth } from "@/shared/auth";
import { handleApiError } from "@/app/adapter/api/client";
import { useSelection, useConfirmDialogEmpty } from "@/shared/hooks";
import { listCompanies, deleteCompany, batchDeleteCompanies, deleteAllCompanies } from "../services/companies.api";
import type { Company } from "@/shared/types/company";

const DEFAULT_LIMIT = 100;

export function useCompaniesPageContainer() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCompanyId, setEditCompanyId] = useState<number | null>(null);
  const [detailsCompanyId, setDetailsCompanyId] = useState<number | null>(null);
  const [pendingForceIds, setPendingForceIds] = useState<number[]>([]);

  const { selectedIds, selectionConfig, clear: clearSelection } = useSelection(companies, (c) => c.id);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, count: c } = await listCompanies({
        search: search.trim() || undefined,
        limit: DEFAULT_LIMIT,
      });
      setCompanies(data);
      setCount(c);
    } catch (e) {
      console.error("Failed to fetch companies:", e);
      setError(handleApiError(e));
      setCompanies([]);
      setCount(undefined);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleRefresh = useCallback(() => {
    fetchList();
  }, [fetchList]);

  const handleSearchDebounced = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleOpenCreate = useCallback(() => setIsCreateOpen(true), []);
  const handleCloseCreate = useCallback(() => setIsCreateOpen(false), []);
  const handleCreateSuccess = useCallback(() => {
    setIsCreateOpen(false);
    fetchList();
  }, [fetchList]);

  const handleOpenEdit = useCallback((id: number) => setEditCompanyId(id), []);
  const handleCloseEdit = useCallback(() => setEditCompanyId(null), []);
  const handleEditSuccess = useCallback(() => {
    setEditCompanyId(null);
    fetchList();
  }, [fetchList]);

  const handleOpenDetails = useCallback((id: number) => setDetailsCompanyId(id), []);
  const handleCloseDetails = useCallback(() => setDetailsCompanyId(null), []);

  const confirmDelete = useCallback(
    async (id: number) => {
      try {
        await deleteCompany(id);
        toast.success(t("companies.deleteSuccess", { defaultValue: "Company deleted successfully." }));
        fetchList();
      } catch (e: unknown) {
        const resData = (e as { response?: { data?: { code?: string; message_ar?: string } } })?.response?.data;
        const lng = i18n.resolvedLanguage ?? i18n.language;
        const isAr = typeof lng === "string" && lng.startsWith("ar");
        const message =
          isAr && resData?.message_ar
            ? resData.message_ar
            : resData?.code === "COMPANY_HAS_FOLDERS"
              ? t("companies.cannotDeleteHasFolders", {
                  defaultValue: "Cannot delete company that has folders. Remove or move folders first.",
                })
              : handleApiError(e);
        toast.error(message);
        throw e;
      }
    },
    [t, i18n.resolvedLanguage, i18n.language, fetchList]
  );

  /** Second step: delete skipped ids with `force: true` after user confirms in the force modal. */
  const handleForceDeleteConfirm = useCallback(async () => {
    if (pendingForceIds.length === 0) return;
    try {
      const result = await batchDeleteCompanies(pendingForceIds, true);
      const n = result.deleted?.length ?? 0;
      toast.success(
        t("companies.forceDeleteResult", {
          defaultValue: "{{count}} company(ies) force-deleted.",
          count: n,
        })
      );
      if (result.errors?.length) {
        for (const err of result.errors) {
          const msg = err.message?.trim() || String(err.id ?? "");
          if (msg) toast.error(msg);
        }
      }
      setPendingForceIds([]);
      clearSelection();
      fetchList();
    } catch (e) {
      toast.error(handleApiError(e));
      throw e;
    }
  }, [pendingForceIds, t, clearSelection, fetchList]);

  const forceDeleteDialog = useConfirmDialogEmpty({ onConfirm: handleForceDeleteConfirm });

  const handleCloseForceDeleteDialog = useCallback(() => {
    setPendingForceIds([]);
    forceDeleteDialog.close();
  }, [forceDeleteDialog.close]);

  /** Batch-delete selected ids with `force: false`; opens force modal if any row was skipped (active folders). */
  const handleBatchDeleteConfirm = useCallback(async () => {
    const ids = selectedIds.map((id) => Number(id)).filter((n) => !Number.isNaN(n));
    if (ids.length === 0) return;
    try {
      const result = await batchDeleteCompanies(ids, false);
      const deletedN = result.deleted?.length ?? 0;
      const skippedN = result.skipped?.length ?? 0;
      const errN = result.errors?.length ?? 0;
      toast.success(
        t("companies.batchDeleteResult", {
          defaultValue: "{{deleted}} deleted, {{skipped}} skipped.",
          deleted: deletedN,
          skipped: skippedN,
        })
      );
      if (errN > 0) {
        for (const err of result.errors) {
          const msg = err.message?.trim() || String(err.id ?? "");
          if (msg) toast.error(msg);
        }
      }
      clearSelection();
      fetchList();
      if (skippedN > 0 && result.skipped?.length) {
        setPendingForceIds(result.skipped.map((s) => s.id));
        forceDeleteDialog.open();
      } else {
        setPendingForceIds([]);
      }
    } catch (e) {
      toast.error(handleApiError(e));
      throw e;
    }
  }, [selectedIds, t, clearSelection, fetchList, forceDeleteDialog.open]);

  const batchDeleteDialog = useConfirmDialogEmpty({ onConfirm: handleBatchDeleteConfirm });

  /** Delete-all with `force: false`; opens force modal for skipped companies (same follow-up as batch). */
  const handleDeleteAllConfirm = useCallback(async () => {
    try {
      const result = await deleteAllCompanies(false);
      const deletedN = result.deleted_count ?? result.deleted?.length ?? 0;
      const skippedN = result.skipped?.length ?? 0;
      toast.success(
        t("companies.deleteAllResult", {
          defaultValue: "{{deleted}} companies removed, {{skipped}} skipped.",
          deleted: deletedN,
          skipped: skippedN,
        })
      );
      clearSelection();
      fetchList();
      if (skippedN > 0 && result.skipped?.length) {
        setPendingForceIds(result.skipped.map((s) => s.id));
        forceDeleteDialog.open();
      } else {
        setPendingForceIds([]);
      }
    } catch (e) {
      toast.error(handleApiError(e));
      throw e;
    }
  }, [t, clearSelection, fetchList, forceDeleteDialog.open]);

  const deleteAllDialog = useConfirmDialogEmpty({ onConfirm: handleDeleteAllConfirm });

  const isSomeSelected = selectedIds.length > 0;

  const countLabel = useMemo(() => {
    if (loading) return t("common.loading", { defaultValue: "Loading..." });
    const n = count ?? companies.length;
    return `${n} ${n === 1 ? t("companies.company", { defaultValue: "company" }) : t("companies.companies", { defaultValue: "companies" })}`;
  }, [loading, count, companies.length, t]);

  return {
    data: {
      companies,
      count,
      countLabel,
      routes: all_routes,
    },
    loading,
    error,
    actions: {
      handleRefresh,
      handleSearchDebounced,
      handleOpenCreate,
      handleCloseCreate,
      handleCreateSuccess,
      handleOpenEdit,
      handleCloseEdit,
      handleEditSuccess,
      handleOpenDetails,
      handleCloseDetails,
      confirmDelete,
      openBatchDeleteDialog: batchDeleteDialog.open,
      openDeleteAllDialog: deleteAllDialog.open,
    },
    modals: {
      isCreateOpen,
      editCompanyId,
      detailsCompanyId,
      selectionConfig,
      isSomeSelected,
      selectedBatchCount: selectedIds.length,
      batchDeleteDialogProps: batchDeleteDialog.modalProps,
      deleteAllDialogProps: deleteAllDialog.modalProps,
      forceDeleteDialogProps: {
        ...forceDeleteDialog.modalProps,
        onClose: handleCloseForceDeleteDialog,
      },
      pendingForceSkipCount: pendingForceIds.length,
    },
    isAdmin: getIsManager(user),
  };
}
