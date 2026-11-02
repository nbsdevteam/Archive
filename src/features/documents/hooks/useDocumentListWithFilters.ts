import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { DocumentType } from "@/app/adapter/api/admin.api";
import { documentsApi, type Document } from "@/app/adapter/api/documents.api";
import type { DateRangeMode, SelectOption } from "@/shared/components/ui";
import { useInfiniteList } from "@/shared/hooks/useInfiniteList";
import { documentTypesQuery } from "@/shared/lib/cachedReads";
import { queryKeys } from "@/shared/lib/queryKeys";
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
  /** Rows requested per scroll increment. */
  perPage?: number;
}

const DEFAULT_PAGE_SIZE = 20;
const getDocumentId = (d: Document) => d.id;

const EMPTY_DOCUMENT_TYPES: DocumentType[] = [];

/**
 * Shared hook for document list pages: filter state, department/document-type options, search,
 * selection, and the cached infinite document list. Uses useDepartmentsStore for departments everywhere.
 * Used by useDocumentsPageContainer and useArchivedDocumentsPageContainer to avoid duplication.
 */
export function useDocumentListWithFilters(
  options: UseDocumentListWithFiltersOptions = {}
) {
  const { status, perPage = DEFAULT_PAGE_SIZE } = options;

  const [appliedFilters, setAppliedFilters] = useState<DocumentListFilterState>({});
  const [draftFilters, setDraftFilters] = useState<DocumentListFilterState>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { t } = useTranslation();
  const { departments, fetchDepartments } = useDepartmentsStore();
  const { companies, fetchCompanies } = useCompaniesStore();
  /** Only values that are set go to the API (from_date/to_date are never "-" or empty). */
  const listParams = useMemo(
    () => ({
      ...(appliedFilters.department_id != null ? { department_id: appliedFilters.department_id } : {}),
      ...(appliedFilters.document_type_id != null ? { document_type_id: appliedFilters.document_type_id } : {}),
      ...(appliedFilters.company_id != null ? { company_id: appliedFilters.company_id } : {}),
      ...(appliedFilters.from_date != null && appliedFilters.from_date !== "" ? { from_date: appliedFilters.from_date } : {}),
      ...(appliedFilters.to_date != null && appliedFilters.to_date !== "" ? { to_date: appliedFilters.to_date } : {}),
      ...(status != null ? { status } : {}),
      ...(search.length >= 1 ? { search } : {}),
    }),
    [
      appliedFilters.department_id,
      appliedFilters.document_type_id,
      appliedFilters.company_id,
      appliedFilters.from_date,
      appliedFilters.to_date,
      status,
      search,
    ],
  );

  const {
    items: documents,
    loading: isLoading,
    error,
    refetch,
    paging,
  } = useInfiniteList({
    queryKey: queryKeys.documents.list({ ...listParams, per_page: perPage }),
    perPage,
    fetchPage: (page, per_page) => documentsApi.getDocuments({ ...listParams, page, per_page }),
    getItems: (response) => response?.data,
    getMeta: (response) => response?.pagination,
    getItemId: getDocumentId,
  });

  const {
    selectedIds: selectedDocumentIdsRaw,
    selectionConfig: baseSelectionConfig,
    clear: clearSelection,
    deselectIds: deselectDocumentIds,
  } = useSelection<Document>(documents, getDocumentId);

  /** Selected document ids as numbers for batch APIs and batch-action service. */
  const selectedDocumentIds = useMemo(
    () => selectedDocumentIdsRaw.map((id) => Number(id)),
    [selectedDocumentIdsRaw]
  );

  useRunOnceOnMount(() => {
    fetchDepartments();
  });
  useRunOnceOnMount(() => {
    fetchCompanies({ limit: 100 });
  });
  const departmentIdForTypes = draftFilters.department_id;

  const hasDepartmentForTypes = departmentIdForTypes != null && departmentIdForTypes >= 1;
  const { data: documentTypes = EMPTY_DOCUMENT_TYPES } = useQuery({
    ...documentTypesQuery(departmentIdForTypes ?? 0),
    enabled: hasDepartmentForTypes,
    select: (response) => response?.data ?? EMPTY_DOCUMENT_TYPES,
  });

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

  const handleSearchDebounced = useCallback((value: string) => setSearch(value), []);

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

  const handleApplyFilter = useCallback(() => {
    setAppliedFilters(draftFilters);
    setIsFilterOpen(false);
  }, [draftFilters]);

  const handleClearFilter = useCallback(() => {
    setDraftFilters({});
    setAppliedFilters({});
    setIsFilterOpen(false);
  }, []);

  /** Cancel: clear all filters only if a date filter was previously applied; then caller closes panel. */
  const handleCancelFilter = useCallback(() => {
    const hadDate = !!(appliedFilters.from_date || appliedFilters.to_date);
    if (!hadDate) return;
    setDraftFilters({});
    setAppliedFilters({});
    setIsFilterOpen(false);
  }, [appliedFilters.from_date, appliedFilters.to_date]);

  const handleRetry = refetch;
  const handleRefresh = refetch;

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
    paging,
    refetch,
    appliedFilters,
    draftFilters,
    isFilterOpen,
    departmentOptions,
    documentTypeOptions,
    companyOptions,
    filterApplyDisabled,
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
