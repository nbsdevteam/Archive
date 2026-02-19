import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/app/adapter/api/admin.api";
import type { Document } from "@/app/adapter/api/documents.api";
import type { DateRangeMode, SelectOption } from "@/shared/components/ui";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { useDepartmentsStore } from "@/shared/stores/departmentsStore";
import { useCompaniesStore } from "@/shared/stores/companiesStore";
import { useRunOnceOnMount, useSelection } from "@/shared/hooks";

/** Converts a Date to YYYY-MM-DD for API (date-only, no time). */
function toDateOnlyString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parses YYYY-MM-DD string to Date at local midnight. */
function parseDateOnly(s: string | undefined): Date | null {
  if (!s || s.trim() === "") return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

/** Derives date range mode from applied/draft from_date and to_date. */
function deriveDateMode(f: DocumentListFilterState): DateRangeMode {
  if (f.from_date && f.to_date) return "between";
  if (f.from_date) return "after";
  if (f.to_date) return "upto";
  return "after";
}

export interface DocumentListFilterState {
  department_id?: number;
  document_type_id?: number;
  company_id?: number;
  from_date?: string;
  to_date?: string;
  /** UI-only: which date range mode is selected (after/upto/between). */
  date_mode?: DateRangeMode;
}

export interface UseDocumentListWithFiltersOptions {
  /** If set, all fetches include this status (e.g. "archived"). */
  status?: string;
  /** If true, fetches use page/per_page and the hook returns pagination + handlePageChange. */
  paginated?: boolean;
  /** When set (e.g. from URL), fetches use this page and refetch when it changes. */
  pageOverride?: number;
  /** When set (e.g. from URL), fetches use this per_page and refetch when it changes. */
  perPageOverride?: number;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Shared hook for document list pages: filter state, department/document-type options,
 * search ref, selection, and refetch params. Uses useDepartmentsStore for departments everywhere.
 * Used by useDocumentsPageContainer and useArchivedDocumentsPageContainer to avoid duplication.
 */
export function useDocumentListWithFilters(
  options: UseDocumentListWithFiltersOptions = {}
) {
  const { status, paginated = false, pageOverride, perPageOverride } = options;

  const [appliedFilters, setAppliedFilters] = useState<DocumentListFilterState>({});
  const [draftFilters, setDraftFilters] = useState<DocumentListFilterState>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<
    Array<{
      id: number;
      name: string;
      code: string;
      department_id: number;
      department_name: string;
    }>
  >([]);

  const { t } = useTranslation();
  const {
    documents,
    isLoading,
    fetchDocuments,
    error,
    clearError,
    pagination,
  } = useDocumentStore();
  const { departments, fetchDepartments } = useDepartmentsStore();
  const { companies, fetchCompanies } = useCompaniesStore();
  /** Holds current search term so getFetchParams can read it without causing fetch dependency churn. */
  const lastSearchRef = useRef<string>("");

  const {
    selectedIds: selectedDocumentIdsRaw,
    selectionConfig: baseSelectionConfig,
    clear: clearSelection,
    deselectIds: deselectDocumentIds,
  } = useSelection<Document>(documents, (d) => d.id);

  /** Selected document ids as numbers for batch APIs and batch-action service. */
  const selectedDocumentIds = useMemo(
    () => selectedDocumentIdsRaw.map((id) => Number(id)),
    [selectedDocumentIdsRaw]
  );

  /** Builds fetch params from current filter state; only includes from_date/to_date when set (never "-" or empty). */
  const getFetchParams = useCallback(
    (overrides?: { page?: number; per_page?: number }) => {
      const search = lastSearchRef.current;
      const params: Record<string, unknown> = {
        ...(appliedFilters.department_id != null ? { department_id: appliedFilters.department_id } : {}),
        ...(appliedFilters.document_type_id != null ? { document_type_id: appliedFilters.document_type_id } : {}),
        ...(appliedFilters.company_id != null ? { company_id: appliedFilters.company_id } : {}),
        ...(appliedFilters.from_date != null && appliedFilters.from_date !== "" ? { from_date: appliedFilters.from_date } : {}),
        ...(appliedFilters.to_date != null && appliedFilters.to_date !== "" ? { to_date: appliedFilters.to_date } : {}),
        ...(status != null ? { status } : {}),
        ...(search.length >= 1 ? { search } : {}),
      };
      if (paginated) {
        params.page = overrides?.page ?? pageOverride ?? 1;
        params.per_page = overrides?.per_page ?? perPageOverride ?? DEFAULT_PAGE_SIZE;
      }
      return params;
    },
    [appliedFilters, status, paginated, pageOverride, perPageOverride]
  );

  const initialFetch = useCallback(() => {
    fetchDocuments(getFetchParams());
  }, [fetchDocuments, getFetchParams]);

  useRunOnceOnMount(() => {
    fetchDepartments();
  });
  useRunOnceOnMount(() => {
    fetchCompanies({ limit: 100 });
  });
  /** When paginated with URL overrides, the effect below does the fetch; otherwise run once on mount. */
  useRunOnceOnMount(() => {
    if (paginated && (pageOverride != null || perPageOverride != null)) return;
    initialFetch();
  });

  /** When URL-driven page/per_page are provided, fetch so list stays in sync with URL (and on mount). */
  useEffect(() => {
    if (!paginated) return;
    if (pageOverride != null || perPageOverride != null) {
      fetchDocuments(
        getFetchParams({
          page: pageOverride ?? 1,
          per_page: perPageOverride ?? DEFAULT_PAGE_SIZE,
        })
      );
    }
  }, [paginated, pageOverride, perPageOverride, fetchDocuments, getFetchParams]);

  const departmentIdForTypes = draftFilters.department_id;

  useEffect(() => {
    if (departmentIdForTypes == null || departmentIdForTypes < 1) {
      setDocumentTypes([]);
      return;
    }
    let cancelled = false;
    adminApi.getDocumentTypes(departmentIdForTypes).then((res) => {
      if (!cancelled && res?.data) {
        setDocumentTypes(res.data);
      } else if (!cancelled) {
        setDocumentTypes([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [departmentIdForTypes]);

  const departmentOptions: SelectOption<number>[] = useMemo(
    () => departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
    [departments]
  );

  const documentTypeOptions: SelectOption<number>[] = useMemo(
    () => documentTypes.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
    [documentTypes]
  );

  const companyOptions: SelectOption<number>[] = useMemo(
    () => companies.map((c) => ({ value: c.id, label: c.name })),
    [companies]
  );

  const filterApplyDisabled = useMemo(
    () =>
      draftFilters.department_id === appliedFilters.department_id &&
      draftFilters.document_type_id === appliedFilters.document_type_id &&
      draftFilters.company_id === appliedFilters.company_id &&
      draftFilters.from_date === appliedFilters.from_date &&
      draftFilters.to_date === appliedFilters.to_date,
    [
      draftFilters.department_id,
      draftFilters.document_type_id,
      draftFilters.company_id,
      draftFilters.from_date,
      draftFilters.to_date,
      appliedFilters.department_id,
      appliedFilters.document_type_id,
      appliedFilters.company_id,
      appliedFilters.from_date,
      appliedFilters.to_date,
    ]
  );

  const handleSearchDebounced = useCallback(
    (value: string) => {
      const hadSearch = lastSearchRef.current.length >= 1;
      lastSearchRef.current = value;
      if (paginated) {
        if (value.length >= 1) {
          fetchDocuments({ ...getFetchParams(), search: value, page: 1 });
        } else if (hadSearch) {
          fetchDocuments(getFetchParams());
        }
      } else {
        if (value.length >= 1) {
          fetchDocuments({ ...getFetchParams(), search: value });
        } else if (hadSearch) {
          fetchDocuments(getFetchParams());
        }
      }
    },
    [fetchDocuments, getFetchParams, paginated]
  );

  const handleOpenFilter = useCallback(() => {
    setDraftFilters({ ...appliedFilters, date_mode: deriveDateMode(appliedFilters) });
    setIsFilterOpen(true);
  }, [appliedFilters]);

  const handleCloseFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const handlePrimaryFilterChange = useCallback(
    (value: number | string | null) => {
      setDraftFilters((prev) => ({
        ...prev,
        department_id:
          value != null && typeof value === "number" ? value : undefined,
        document_type_id: undefined,
      }));
    },
    []
  );

  const handleSecondaryFilterChange = useCallback(
    (value: number | string | null) => {
      setDraftFilters((prev) => ({
        ...prev,
        document_type_id:
          value != null && typeof value === "number" ? value : undefined,
      }));
    },
    []
  );

  const handleTertiaryFilterChange = useCallback(
    (value: number | string | null) => {
      setDraftFilters((prev) => ({
        ...prev,
        company_id:
          value != null && typeof value === "number" ? value : undefined,
      }));
    },
    []
  );

  /** Updates draft date range mode (After/Upto/Between) for the date picker tabs. */
  const handleDateRangeModeChange = useCallback((mode: DateRangeMode) => {
    setDraftFilters((prev) => ({ ...prev, date_mode: mode }));
  }, []);

  /** Updates draft from_date/to_date from date picker; only stores YYYY-MM-DD, never "-". */
  const handleDateRangeChange = useCallback(
    (args: { fromDate: Date | null; toDate: Date | null }) => {
      setDraftFilters((prev) => ({
        ...prev,
        from_date: args.fromDate != null ? toDateOnlyString(args.fromDate) : undefined,
        to_date: args.toDate != null ? toDateOnlyString(args.toDate) : undefined,
      }));
    },
    []
  );

  const buildApiParams = useCallback(
    (filters: DocumentListFilterState) => {
      const params: Record<string, unknown> = {
        ...(filters.department_id != null ? { department_id: filters.department_id } : {}),
        ...(filters.document_type_id != null ? { document_type_id: filters.document_type_id } : {}),
        ...(filters.company_id != null ? { company_id: filters.company_id } : {}),
        ...(filters.from_date != null && filters.from_date !== "" ? { from_date: filters.from_date } : {}),
        ...(filters.to_date != null && filters.to_date !== "" ? { to_date: filters.to_date } : {}),
        ...(status != null ? { status } : {}),
        ...(lastSearchRef.current.length >= 1 ? { search: lastSearchRef.current } : {}),
      };
      if (paginated) {
        params.page = 1;
        params.per_page = DEFAULT_PAGE_SIZE;
      }
      return params;
    },
    [status, paginated]
  );

  const handleApplyFilter = useCallback(() => {
    setAppliedFilters(draftFilters);
    fetchDocuments(buildApiParams(draftFilters));
    setIsFilterOpen(false);
  }, [draftFilters, fetchDocuments, buildApiParams]);

  const handleClearFilter = useCallback(() => {
    setDraftFilters({});
    setAppliedFilters({});
    const params: Record<string, unknown> = {
      ...(status != null ? { status } : {}),
      ...(lastSearchRef.current.length >= 1 ? { search: lastSearchRef.current } : {}),
    };
    if (paginated) {
      params.page = 1;
      params.per_page = DEFAULT_PAGE_SIZE;
    }
    fetchDocuments(params);
    setIsFilterOpen(false);
  }, [fetchDocuments, status, paginated]);

  /** Cancel: clear all filters and refetch only if a date filter was previously applied; then caller closes panel. */
  const handleCancelFilter = useCallback(() => {
    const hadDate = !!(appliedFilters.from_date || appliedFilters.to_date);
    if (!hadDate) return;
    setDraftFilters({});
    setAppliedFilters({});
    const params: Record<string, unknown> = {
      ...(status != null ? { status } : {}),
      ...(lastSearchRef.current.length >= 1 ? { search: lastSearchRef.current } : {}),
    };
    if (paginated) {
      params.page = 1;
      params.per_page = DEFAULT_PAGE_SIZE;
    }
    fetchDocuments(params);
    setIsFilterOpen(false);
  }, [appliedFilters.from_date, appliedFilters.to_date, fetchDocuments, status, paginated]);

  const handleRetry = useCallback(() => {
    clearError();
    fetchDocuments(getFetchParams());
  }, [clearError, fetchDocuments, getFetchParams]);

  const handleRefresh = useCallback(() => {
    fetchDocuments(getFetchParams());
  }, [fetchDocuments, getFetchParams]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchDocuments({
        ...getFetchParams(),
        page,
        per_page: perPageOverride ?? DEFAULT_PAGE_SIZE,
      });
    },
    [fetchDocuments, getFetchParams, perPageOverride]
  );

  const isSomeSelected = selectedDocumentIds.length > 0;
  const selectionConfig = useMemo(
    () => ({
      ...baseSelectionConfig,
      getRowAriaLabel: (row: Document) =>
        t("documents.selectDocument", {
          defaultValue: 'Select document "{{title}}"',
          title: row.title || row.name || row.barcode || String(row.id),
        }),
    }),
    [baseSelectionConfig, t]
  );

  const dateRangeFromDate = useMemo(
    () => parseDateOnly(draftFilters.from_date),
    [draftFilters.from_date]
  );
  const dateRangeToDate = useMemo(
    () => parseDateOnly(draftFilters.to_date),
    [draftFilters.to_date]
  );
  const dateRangeMode = draftFilters.date_mode ?? deriveDateMode(draftFilters);
  const hasAppliedDateFilter = !!(appliedFilters.from_date || appliedFilters.to_date);

  return {
    documents,
    isLoading,
    error,
    clearError,
    pagination,
    appliedFilters,
    draftFilters,
    isFilterOpen,
    departmentOptions,
    documentTypeOptions,
    companyOptions,
    filterApplyDisabled,
    lastSearchRef,
    getFetchParams,
    handleSearchDebounced,
    handleOpenFilter,
    handleCloseFilter,
    handlePrimaryFilterChange,
    handleSecondaryFilterChange,
    handleTertiaryFilterChange,
    handleDateRangeModeChange,
    handleDateRangeChange,
    handleApplyFilter,
    handleClearFilter,
    handleCancelFilter,
    handleRetry,
    handleRefresh,
    handlePageChange,
    selectedDocumentIds,
    selectionConfig,
    clearSelection,
    deselectDocumentIds,
    isSomeSelected,
    dateRangeFromDate,
    dateRangeToDate,
    dateRangeMode,
    hasAppliedDateFilter,
  };
}
