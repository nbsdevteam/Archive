import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { all_routes } from "@/router/all_routes";
import { IS_ADMIN } from "@/shared/constants/access";
import { handleApiError } from "@/app/adapter/api/client";
import {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../services/companies.api";
import type { Company } from "@/shared/types/company";

const DEFAULT_LIMIT = 100;

export function useCompaniesPageContainer() {
  const { t, i18n } = useTranslation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCompanyId, setEditCompanyId] = useState<number | null>(null);
  const [detailsCompanyId, setDetailsCompanyId] = useState<number | null>(null);

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
        const isAr = i18n.language === "ar";
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
    [t, i18n.language, fetchList]
  );

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
    },
    modals: {
      isCreateOpen,
      editCompanyId,
      detailsCompanyId,
    },
    isAdmin: IS_ADMIN,
  };
}
